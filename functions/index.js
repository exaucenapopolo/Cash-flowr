// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(); // Utilise les credentials de l'environnement Cloud Functions

/**
 * Retourne la date string YYYY-MM-DD en timezone Africa/Douala
 */
function getTodayStringInCameroon() {
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Douala', year:'numeric', month:'2-digit', day:'2-digit' });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

/**
 * Retourne true si c'est Lundi en Africa/Douala
 */
function isMondayInCameroon() {
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Douala', weekday: 'long' });
  return weekdayFormatter.format(new Date()).toLowerCase() === 'monday';
}

exports.processTikTokClaim = functions.firestore
  .document('tiktokClaims/{claimId}')
  .onCreate(async (snap, ctx) => {
    const claimId = ctx.params.claimId;
    const data = snap.data() || {};
    const db = admin.firestore();

    console.log(`processTikTokClaim triggered for ${claimId}`, { claimPreview: { uid: data.uid, rewardAmount: data.rewardAmount, videoIndex: data.videoIndex }});

    // Basic validation
    if (!data.uid) {
      await snap.ref.update({ processed: false, reason: 'uid_missing' });
      console.warn('Claim rejected: uid missing', claimId);
      return;
    }

    const rewardAmount = Number(data.rewardAmount || 0);
    if (rewardAmount !== 250) {
      await snap.ref.update({ processed: false, reason: 'invalid_reward_amount' });
      console.warn('Claim rejected: invalid reward amount', claimId, rewardAmount);
      return;
    }

    // Vérifier que c'est LUNDI (Africa/Douala)
    if (!isMondayInCameroon()) {
      await snap.ref.update({ processed: false, reason: 'not_monday' });
      console.warn('Claim rejected: not Monday in Africa/Douala', claimId);
      return;
    }

    const uid = data.uid;
    const userRef = db.collection('users').doc(uid);
    const claimRef = snap.ref;
    const todayStr = getTodayStringInCameroon();

    try {
      await db.runTransaction(async (tx) => {
        const userDoc = await tx.get(userRef);
        if (!userDoc.exists) {
          // marque la claim rejetée (transaction abort)
          await tx.update(claimRef, { processed: false, reason: 'user_not_found' });
          throw new Error('user_not_found');
        }

        const user = userDoc.data() || {};
        const lastWatchDate = user.lastTikTokWatchDate || null;
        const watchesToday = (lastWatchDate === todayStr) ? (user.tikTokWatchesToday || 0) : 0;

        if (watchesToday >= 2) {
          await tx.update(claimRef, { processed: false, reason: 'limit_reached' });
          throw new Error('limit_reached');
        }

        // Mise à jour atomique du user
        tx.update(userRef, {
          tiktokGains: admin.firestore.FieldValue.increment(rewardAmount),
          solde: admin.firestore.FieldValue.increment(rewardAmount),
          tikTokWatchesToday: admin.firestore.FieldValue.increment(1),
          tikTokEarningsToday: admin.firestore.FieldValue.increment(rewardAmount),
          lastTikTokWatchDate: todayStr
        });

        // Écrire un log d'historique
        const historyRef = db.collection('tiktokClaimHistory').doc();
        tx.set(historyRef, {
          userId: uid,
          claimId: claimId,
          rewardAmount,
          videoIndex: data.videoIndex || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Mettre à jour la claim comme processed (temporaire — transaction la marque)
        tx.update(claimRef, {
          processed: true,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          reason: null
        });
      });

      // Après transaction : récupérer l'utilisateur mis à jour pour ajouter des infos utiles dans la claim
      const updatedUserSnap = await userRef.get();
      const updatedUser = updatedUserSnap.data() || {};
      await claimRef.update({
        newBalance: updatedUser.solde || 0,
        videosWatchedToday: updatedUser.tikTokWatchesToday || 0,
        earningsToday: updatedUser.tikTokEarningsToday || 0
      });

      console.log(`Claim ${claimId} processed successfully for uid=${uid}`);
      return;
    } catch (err) {
      console.error(`Error processing claim ${claimId}:`, err && err.message ? err.message : err);
      // Si la transaction a déjà marqué processed:false, on laisse tel quel
      return;
    }
  });

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { userRepository } from '../repositories/userRepository';
import { oauthRepository } from '../repositories/oauthRepository';

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email provided by Google'), undefined);
          }

          let user = await userRepository.findByEmail(email);

          if (user) {
            const oauthAccount = await oauthRepository.findByUserProvider(user.id, 'google');
            if (!oauthAccount) {
              await oauthRepository.create({
                userId: user.id,
                provider: 'google',
                providerUserId: profile.id,
                accessToken,
                refreshToken,
                tokenExpiresAt: null,
              });
            } else {
              await oauthRepository.updateById(oauthAccount.id, {
                accessToken,
                refreshToken,
                tokenExpiresAt: null,
              });
            }
          } else {
            const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User';
            const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';

            user = await userRepository.create({
              email,
              passwordHash: '',
              firstName,
              lastName,
              phone: null,
            });

            await oauthRepository.create({
              userId: user.id,
              provider: 'google',
              providerUserId: profile.id,
              accessToken,
              refreshToken,
              tokenExpiresAt: null,
            });

            if (profile.photos && profile.photos.length > 0) {
              await userRepository.updateProfile(user.id, {
                profileImageUrl: profile.photos[0].value,
              });
            }
            await userRepository.updateEmailVerified(user.id, true);
          }

          const updatedUser = await userRepository.findById(user.id);
          return done(null, updatedUser || undefined);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;

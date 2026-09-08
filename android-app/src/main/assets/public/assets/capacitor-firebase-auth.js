var capacitorFirebaseAuthentication = (function (exports, core, auth) {
    'use strict';

    /// <reference types="@capacitor/cli" />
    exports.ProviderId = void 0;
    (function (ProviderId) {
        ProviderId["APPLE"] = "apple.com";
        ProviderId["FACEBOOK"] = "facebook.com";
        ProviderId["GAME_CENTER"] = "gc.apple.com";
        ProviderId["GITHUB"] = "github.com";
        ProviderId["GOOGLE"] = "google.com";
        ProviderId["MICROSOFT"] = "microsoft.com";
        ProviderId["PLAY_GAMES"] = "playgames.google.com";
        ProviderId["TWITTER"] = "twitter.com";
        ProviderId["YAHOO"] = "yahoo.com";
        ProviderId["PASSWORD"] = "password";
        ProviderId["PHONE"] = "phone";
    })(exports.ProviderId || (exports.ProviderId = {}));

    const FirebaseAuthentication = core.registerPlugin('FirebaseAuthentication', {
        web: () => Promise.resolve().then(function () { return web; }).then(m => new m.FirebaseAuthenticationWeb()),
    });

    class FirebaseAuthenticationWeb extends core.WebPlugin {
        constructor() {
            super();
            const auth$1 = auth.getAuth();
            auth$1.onAuthStateChanged(user => this.handleAuthStateChange(user));
        }
        async applyActionCode(options) {
            const auth$1 = auth.getAuth();
            return auth.applyActionCode(auth$1, options.oobCode);
        }
        async createUserWithEmailAndPassword(options) {
            const auth$1 = auth.getAuth();
            const userCredential = await auth.createUserWithEmailAndPassword(auth$1, options.email, options.password);
            return this.createSignInResult(userCredential, null);
        }
        async confirmPasswordReset(options) {
            const auth$1 = auth.getAuth();
            return auth.confirmPasswordReset(auth$1, options.oobCode, options.newPassword);
        }
        async confirmVerificationCode(_options) {
            throw new Error('Not implemented on web.');
        }
        async deleteUser() {
            const auth$1 = auth.getAuth();
            const currentUser = auth$1.currentUser;
            if (!currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            return auth.deleteUser(currentUser);
        }
        async getCurrentUser() {
            const auth$1 = auth.getAuth();
            const userResult = this.createUserResult(auth$1.currentUser);
            const result = {
                user: userResult,
            };
            return result;
        }
        async getIdToken(options) {
            const auth$1 = auth.getAuth();
            if (!auth$1.currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            const idToken = await auth$1.currentUser.getIdToken(options === null || options === void 0 ? void 0 : options.forceRefresh);
            const result = {
                token: idToken || '',
            };
            return result;
        }
        async getRedirectResult() {
            const auth$1 = auth.getAuth();
            const userCredential = await auth.getRedirectResult(auth$1);
            const authCredential = userCredential
                ? auth.OAuthProvider.credentialFromResult(userCredential)
                : null;
            return this.createSignInResult(userCredential, authCredential);
        }
        async getTenantId() {
            const auth$1 = auth.getAuth();
            return {
                tenantId: auth$1.tenantId,
            };
        }
        async isSignInWithEmailLink(options) {
            const auth$1 = auth.getAuth();
            return {
                isSignInWithEmailLink: auth.isSignInWithEmailLink(auth$1, options.emailLink),
            };
        }
        async linkWithApple(options) {
            const provider = new auth.OAuthProvider(exports.ProviderId.APPLE);
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.OAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithEmailAndPassword(options) {
            const authCredential = auth.EmailAuthProvider.credential(options.email, options.password);
            const userCredential = await this.linkCurrentUserWithCredential(authCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithEmailLink(options) {
            const authCredential = auth.EmailAuthProvider.credentialWithLink(options.email, options.emailLink);
            const userCredential = await this.linkCurrentUserWithCredential(authCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithFacebook(options) {
            const provider = new auth.FacebookAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.FacebookAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithGameCenter() {
            throw new Error('Not available on web.');
        }
        async linkWithGithub(options) {
            const provider = new auth.GithubAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.GithubAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithGoogle(options) {
            const provider = new auth.GoogleAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.GoogleAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithMicrosoft(options) {
            const provider = new auth.OAuthProvider(exports.ProviderId.MICROSOFT);
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.OAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithPhoneNumber(_options) {
            throw new Error('Not implemented on web.');
        }
        async linkWithPlayGames() {
            throw new Error('Not available on web.');
        }
        async linkWithTwitter(options) {
            const provider = new auth.TwitterAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.TwitterAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async linkWithYahoo(options) {
            const provider = new auth.OAuthProvider(exports.ProviderId.YAHOO);
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.linkCurrentUserWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.OAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async reload() {
            const auth$1 = auth.getAuth();
            const currentUser = auth$1.currentUser;
            if (!currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            return auth.reload(currentUser);
        }
        async sendEmailVerification() {
            const auth$1 = auth.getAuth();
            const currentUser = auth$1.currentUser;
            if (!currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            return auth.sendEmailVerification(currentUser);
        }
        async sendPasswordResetEmail(options) {
            const auth$1 = auth.getAuth();
            return auth.sendPasswordResetEmail(auth$1, options.email);
        }
        async sendSignInLinkToEmail(options) {
            const auth$1 = auth.getAuth();
            return auth.sendSignInLinkToEmail(auth$1, options.email, options.actionCodeSettings);
        }
        async setLanguageCode(options) {
            const auth$1 = auth.getAuth();
            auth$1.languageCode = options.languageCode;
        }
        async signInAnonymously() {
            const auth$1 = auth.getAuth();
            const userCredential = await auth.signInAnonymously(auth$1);
            return this.createSignInResult(userCredential, null);
        }
        async setTenantId(options) {
            const auth$1 = auth.getAuth();
            auth$1.tenantId = options.tenantId;
        }
        async signInWithApple(options) {
            const provider = new auth.OAuthProvider(exports.ProviderId.APPLE);
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.OAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async signInWithCustomToken(options) {
            const auth$1 = auth.getAuth();
            const userCredential = await auth.signInWithCustomToken(auth$1, options.token);
            return this.createSignInResult(userCredential, null);
        }
        async signInWithEmailAndPassword(options) {
            const auth$1 = auth.getAuth();
            const userCredential = await auth.signInWithEmailAndPassword(auth$1, options.email, options.password);
            return this.createSignInResult(userCredential, null);
        }
        async signInWithEmailLink(options) {
            const auth$1 = auth.getAuth();
            const userCredential = await auth.signInWithEmailLink(auth$1, options.email, options.emailLink);
            return this.createSignInResult(userCredential, null);
        }
        async signInWithFacebook(options) {
            const provider = new auth.FacebookAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.FacebookAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async signInWithGithub(options) {
            const provider = new auth.GithubAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.GithubAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async signInWithGoogle(options) {
            const provider = new auth.GoogleAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.GoogleAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async signInWithMicrosoft(options) {
            const provider = new auth.OAuthProvider(exports.ProviderId.MICROSOFT);
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.OAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async signInWithPhoneNumber(_options) {
            throw new Error('Not implemented on web.');
        }
        async signInWithPlayGames() {
            throw new Error('Not available on web.');
        }
        async signInWithGameCenter() {
            throw new Error('Not available on web.');
        }
        async signInWithTwitter(options) {
            const provider = new auth.TwitterAuthProvider();
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.TwitterAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async signInWithYahoo(options) {
            const provider = new auth.OAuthProvider(exports.ProviderId.YAHOO);
            this.applySignInOptions(options || {}, provider);
            const userCredential = await this.signInWithPopupOrRedirect(provider, options === null || options === void 0 ? void 0 : options.mode);
            const authCredential = auth.OAuthProvider.credentialFromResult(userCredential);
            return this.createSignInResult(userCredential, authCredential);
        }
        async signOut() {
            const auth$1 = auth.getAuth();
            await auth$1.signOut();
        }
        async unlink(options) {
            const auth$1 = auth.getAuth();
            if (!auth$1.currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            const user = await auth.unlink(auth$1.currentUser, options.providerId);
            const userResult = this.createUserResult(user);
            const result = {
                user: userResult,
            };
            return result;
        }
        async updateEmail(options) {
            const auth$1 = auth.getAuth();
            const currentUser = auth$1.currentUser;
            if (!currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            return auth.updateEmail(currentUser, options.newEmail);
        }
        async updatePassword(options) {
            const auth$1 = auth.getAuth();
            const currentUser = auth$1.currentUser;
            if (!currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            return auth.updatePassword(currentUser, options.newPassword);
        }
        async updateProfile(options) {
            const auth$1 = auth.getAuth();
            const currentUser = auth$1.currentUser;
            if (!currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            return auth.updateProfile(currentUser, options);
        }
        async useAppLanguage() {
            const auth$1 = auth.getAuth();
            auth$1.useDeviceLanguage();
        }
        async useEmulator(options) {
            const auth$1 = auth.getAuth();
            const port = options.port || 9099;
            auth.connectAuthEmulator(auth$1, `${options.host}:${port}`);
        }
        handleAuthStateChange(user) {
            const userResult = this.createUserResult(user);
            const change = {
                user: userResult,
            };
            this.notifyListeners('authStateChange', change);
        }
        applySignInOptions(options, provider) {
            if (options.customParameters) {
                const customParameters = {};
                options.customParameters.map(parameter => {
                    customParameters[parameter.key] = parameter.value;
                });
                provider.setCustomParameters(customParameters);
            }
            if (options.scopes) {
                for (const scope of options.scopes) {
                    provider.addScope(scope);
                }
            }
        }
        signInWithPopupOrRedirect(provider, mode) {
            const auth$1 = auth.getAuth();
            if (mode === 'redirect') {
                return auth.signInWithRedirect(auth$1, provider);
            }
            else {
                return auth.signInWithPopup(auth$1, provider);
            }
        }
        linkCurrentUserWithPopupOrRedirect(provider, mode) {
            const auth$1 = auth.getAuth();
            if (!auth$1.currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            if (mode === 'redirect') {
                return auth.linkWithRedirect(auth$1.currentUser, provider);
            }
            else {
                return auth.linkWithPopup(auth$1.currentUser, provider);
            }
        }
        linkCurrentUserWithCredential(credential) {
            const auth$1 = auth.getAuth();
            if (!auth$1.currentUser) {
                throw new Error(FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN);
            }
            return auth.linkWithCredential(auth$1.currentUser, credential);
        }
        createSignInResult(userCredential, authCredential) {
            const userResult = this.createUserResult((userCredential === null || userCredential === void 0 ? void 0 : userCredential.user) || null);
            const credentialResult = this.createCredentialResult(authCredential);
            const additionalUserInfoResult = this.createAdditionalUserInfoResult(userCredential);
            const result = {
                user: userResult,
                credential: credentialResult,
                additionalUserInfo: additionalUserInfoResult,
            };
            return result;
        }
        createCredentialResult(credential) {
            if (!credential) {
                return null;
            }
            const result = {
                providerId: credential.providerId,
            };
            if (credential instanceof auth.OAuthCredential) {
                result.accessToken = credential.accessToken;
                result.idToken = credential.idToken;
                result.secret = credential.secret;
            }
            return result;
        }
        createUserResult(user) {
            if (!user) {
                return null;
            }
            const result = {
                displayName: user.displayName,
                email: user.email,
                emailVerified: user.emailVerified,
                isAnonymous: user.isAnonymous,
                phoneNumber: user.phoneNumber,
                photoUrl: user.photoURL,
                providerId: user.providerId,
                tenantId: user.tenantId,
                uid: user.uid,
            };
            return result;
        }
        createAdditionalUserInfoResult(credential) {
            if (!credential) {
                return null;
            }
            const additionalUserInfo = auth.getAdditionalUserInfo(credential);
            if (!additionalUserInfo) {
                return null;
            }
            const { isNewUser, profile, providerId, username } = additionalUserInfo;
            const result = {
                isNewUser,
            };
            if (providerId !== null) {
                result.providerId = providerId;
            }
            if (profile !== null) {
                result.profile = profile;
            }
            if (username !== null && username !== undefined) {
                result.username = username;
            }
            return result;
        }
    }
    FirebaseAuthenticationWeb.ERROR_NO_USER_SIGNED_IN = 'No user is signed in.';

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        FirebaseAuthenticationWeb: FirebaseAuthenticationWeb
    });

    exports.FirebaseAuthentication = FirebaseAuthentication;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, capacitorExports, firebaseAuthExports);
//# sourceMappingURL=plugin.js.map

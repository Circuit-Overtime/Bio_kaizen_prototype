import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { TokenCache } from '@clerk/clerk-expo/dist/cache'
import * as AuthSession from 'expo-auth-session'  
import * as Linking from "expo-linking";
import { fetchAPI } from './fetch';

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key)
        if (item) {
          console.log(`${key} was used 🔐 \n`)
        } else {
          console.log('No values stored under key: ' + key)
        }
        return item
      } catch (error) {
        console.error('secure store get item error: ', error)
        await SecureStore.deleteItemAsync(key)
        return null
      }
    },
    saveToken: (key: string, token: string) => {
      return SecureStore.setItemAsync(key, token)
    },
  }
}

// SecureStore is not supported on the web
export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined


/* export const googleOAuth = async (startSSOFlow: any) => {
    try {
     // Start the authentication process by calling `startSSOFlow()`
     const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
      strategy: 'oauth_google',
      // Defaults to current path
      redirectUrl: AuthSession.makeRedirectUri(),
    })

    // If sign in was successful, set the active session
    if (createdSessionId) {
      setActive!({ session: createdSessionId })
    } else {
      // If there is no `createdSessionId`,
      // there are missing requirements, such as MFA
      // Use the `signIn` or `signUp` returned from `startSSOFlow`
      // to handle next steps
    }
    } catch (error) {
      console.log(error);
    }  

} */
    export const googleOAuth = async (startOAuthFlow: any) => {
      try {
        const { createdSessionId, setActive, signUp } = await startOAuthFlow({
          redirectUrl: Linking.createURL("/(root)/(tabs)/home"),
        });
    
        if (createdSessionId) {
          if (setActive) {
            await setActive({ session: createdSessionId });
    
            if (signUp.createdUserId) {
              await fetchAPI("/(api)/user", {
                method: "POST",
                body: JSON.stringify({
                  name: `${signUp.firstName} ${signUp.lastName}`,
                  email: signUp.emailAddress,
                  clerkId: signUp.createdUserId,
                }),
              });
            }
    
            return {
              success: true,
              code: "success",
              message: "You have successfully signed in with Google",
            };
          }
        }
    
        return {
          success: false,
          code: 'success',
          message: "An error occurred while signing in with Google",
        };
      } catch (err: any) {
        console.error(err);
        return {
          success: false,
          code: err.code,
          message: err?.errors[0]?.longMessage,
        };
      }
    };
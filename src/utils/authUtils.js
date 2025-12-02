import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';

/**
 * Handles the account deletion process.
 * 1. Asks for confirmation.
 * 2. Attempts to delete user data (Best Effort).
 * 3. Deletes the Firebase Auth account.
 */
export const handleDeleteAccount = async () => {
    Alert.alert(
        "Delete Account",
        "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const user = auth().currentUser;
                        if (!user) return;

                        // 1. Best Effort: Try to delete user document in Firestore
                        // We wrap this in a try-catch so it doesn't block the main goal (Auth deletion)
                        try {
                            await firestore().collection('users').doc(user.uid).delete();
                            console.log("User Firestore document deleted (or attempted).");
                        } catch (firestoreError) {
                            console.warn("Could not delete Firestore document (likely permission issues):", firestoreError);
                            // Continue execution...
                        }

                        // 2. Delete Auth Account
                        await user.delete();
                        // Auth state listener in App.js (or similar) should handle the redirection to Login

                    } catch (error) {
                        console.error("Error deleting account:", error);
                        if (error.code === 'auth/requires-recent-login') {
                            Alert.alert(
                                "Security Check",
                                "For security reasons, please log out and log in again before deleting your account."
                            );
                        } else {
                            Alert.alert("Error", "Could not delete account. Please try again later.");
                        }
                    }
                }
            }
        ]
    );
};

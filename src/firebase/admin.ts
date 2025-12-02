import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

if (!admin.apps.length) {
    // When running in a Google Cloud environment, the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable is automatically set. The SDK uses this to initialize.
    // However, for server-side flows, it's safer to be explicit.
    try {
        admin.initializeApp({
            // Explicitly use the projectId from the client config
            projectId: firebaseConfig.projectId,
        });
    } catch(e) {
        console.warn(
            'Admin SDK initialization failed. This may happen in local development if GOOGLE_APPLICATION_CREDENTIALS is not set. The Genkit flow might not work.',
            e
        );
    }
}

export { admin };

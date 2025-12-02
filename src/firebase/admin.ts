import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// Ensure the app is only initialized once
if (!admin.apps.length) {
  // When running in a Google Cloud environment, the GOOGLE_APPLICATION_CREDENTIALS
  // environment variable is usually set, allowing the SDK to initialize automatically.
  // However, in some serverless or local environments, this might not be the case.
  // By explicitly providing the projectId, we make the initialization more robust.
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export { admin };

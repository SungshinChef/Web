

import { Platform } from 'react-native';  // Platform 먼저 import

export const BACKEND_URL = __DEV__
  ? Platform.select({
      ios: 'http://localhost:8000',
      android: 'http://10.0.2.2:8000',
      default: 'http://localhost:8000', // ✅ 웹에서 사용됨
    }) || 'http://localhost:8000'
  : 'http://172.30.1.25:8000';

// @expo/config-plugins에서 필요한 타입을 임포트하여 config 객체의 타입 오류를 줄일 수 있습니다.
// import { ExpoConfig, ConfigContext } from '@expo/config';

// config 객체에 대한 타입 정보를 명시적으로 추가합니다.
// 만약 @expo/config가 설치되어 있다면 위의 주석 처리된 임포트를 사용하고
// 아래 라인을 대체할 수 있습니다: export default ({ config }: ConfigContext): ExpoConfig => {
export default ({ config }: { config: any }) => {
  // 기존 config 객체의 extra 필드를 안전하게 병합합니다.
  const mergedExtra = {
    ...(config.extra || {}),
  };

  // 기존 plugins 배열을 안전하게 가져와 dotenv 플러그인을 추가합니다.
  const mergedPlugins = [
    ...(config.plugins || []),
  ];

  return {
    ...config,
    // 기존 extra 필드와 병합된 새 extra 필드를 사용합니다.
    extra: mergedExtra,
    // 기존 plugins와 dotenv 플러그인이 병합된 새 plugins 배열을 사용합니다.
    plugins: mergedPlugins,
    // 추가적인 Expo 설정이 있다면 여기에 병합할 수 있습니다.
    // 예: updates, ios, android, web 등의 필드
  };
};

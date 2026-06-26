import type { GroupTestOptions } from '../../utils/groupContext';

const platformMode = process.env.PLAYWRIGHT_PLATFORM_MODE === 'true';
const baseURL =
  process.env.INTERVIEW_LOGIN_BASE_URL ||
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  (platformMode ? 'https://host.docker.internal:5172' : 'https://localhost:5172');

export const interviewLoginGroupConfig = {
  baseURL,
  initialURL: '/#/pages/login/index',
  headers: undefined,
  cookies: []
} satisfies GroupTestOptions;

import path from 'node:path';

const MODULE_NAME_MAP: Record<string, string> = {
  interview_agent: '面试助手',
  demo: '演示用例',
  codegen: '录制稿',
};

export function cleanTitle(value: string): string {
  return value.replace(/@\w+/g, '').replace(/\s+/g, ' ').trim();
}

export function deriveAllureMetadata(input: {
  cwd: string;
  file: string;
  title: string;
}) {
  const relativeFile = path.relative(input.cwd, input.file);
  const segments = relativeFile.split(path.sep);
  const testsIndex = segments.indexOf('tests');
  const testSegments = testsIndex >= 0 ? segments.slice(testsIndex + 1) : segments;
  const rawFeature = testSegments.length > 1 ? testSegments[0] : 'root';
  const fileName = path.basename(relativeFile, path.extname(relativeFile));

  return {
    parentSuiteName: '端到端自动化',
    featureName: MODULE_NAME_MAP[rawFeature] ?? rawFeature,
    subSuiteName: fileName,
    storyName: cleanTitle(input.title) || fileName,
  };
}

export function buildAllureEnvironmentInfo(input: {
  env: NodeJS.ProcessEnv;
  browserProject: string;
  generatedAt: string;
  nodeVersion: string;
  osPlatform: string;
  osRelease: string;
}) {
  return {
    执行模式: input.env.CI ? 'CI' : '本地',
    浏览器项目: input.browserProject,
    'Node 版本': input.nodeVersion,
    操作系统: `${input.osPlatform} ${input.osRelease}`,
    报告生成时间: input.generatedAt,
    站点配置模式: 'group_context',
  };
}

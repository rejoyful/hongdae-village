import { describe, expect, it } from 'vitest';
import guide from '../docs/DESIGN_SYSTEM.md?raw';
import main from '../src/main.ts?raw';

describe('Liquid Glass design system contract', () => {
  it('공통 UI 토큰과 접근성 폴백을 문서 계약으로 유지한다', () => {
    [
      '--dw-canvas',
      '--dw-paper',
      '--dw-accent',
      '--dw-glass-regular',
      '--dw-glass-clear',
      'prefers-reduced-transparency',
      'prefers-reduced-motion',
    ].forEach((contract) => expect(guide).toContain(contract));
  });

  it('공통 재질을 화면 전용 CSS 뒤에 로드한다', () => {
    const overlay = main.indexOf("import './ui/overlay.css'");
    const login = main.indexOf("import './ui/designerLogin.css'");
    const liquid = main.indexOf("import './ui/liquidGlass.css'");
    expect(overlay).toBeGreaterThanOrEqual(0);
    expect(login).toBeGreaterThan(overlay);
    expect(liquid).toBeGreaterThan(login);
  });

  it('UI SSOT와 살아 있는 검수 경로를 함께 제공한다', () => {
    expect(guide).toContain('UI 단일 진실 원천(SSOT)');
    expect(guide).toContain('?style-guide');
    expect(main).toContain("params.has('style-guide')");
  });
});

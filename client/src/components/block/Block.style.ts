import { css, cx } from '@styled-system/css';

// 기본 블록 스타일 정의
const baseBlockStyle = css({
  width: 'full',
  margin: 'spacing.sm 0',
  minHeight: 'spacing.lg',
  padding: 'spacing.sm',
  borderRadius: 'radii.xs',
  backgroundColor: 'transparent',
  outline: 'none',
  textStyle: 'display-medium16',
});

// 각 블록 타입별 스타일 정의
export const blockContainer = {
  base: baseBlockStyle,
  
  paragraph: baseBlockStyle,
  
  heading1: cx(
    baseBlockStyle,
    css({
      textStyle: 'display-medium24',
      fontWeight: 'bold',
    })
  ),
  
  heading2: cx(
    baseBlockStyle,
    css({
      textStyle: 'display-medium20',
      fontWeight: 'bold',
    })
  ),
  
  heading3: cx(
    baseBlockStyle,
    css({
      textStyle: 'display-medium16',
      fontWeight: 'bold',
    })
  ),
  
  unorderedList: cx(
    baseBlockStyle,
    css({
      listStyleType: 'disc',
    })
  ),
  
  orderedList: cx(
    baseBlockStyle,
    css({
      listStyleType: 'decimal',
    })
  ),
  
  listItem: css({
    margin: '0',
    padding: '0',
    outline: 'none',
    textStyle: 'display-medium16',
  }),
  
  input: css({
    margin: 'spacing.sm 0',
    textStyle: 'display-medium16',
  }),
  
  blockquote: cx(
    baseBlockStyle,
    css({
      borderLeft: '4px solid token(colors.gray.300)',
      paddingLeft: 'spacing.md',
      fontStyle: 'italic',
      color: 'gray.700',
    })
  ),
};
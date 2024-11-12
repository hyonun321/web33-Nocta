import { css, cx } from '@styled-system/css';

// 기본 블록 스타일 정의
const baseBlockStyle = css({
  width: 'full',
  margin: 'spacing.sm 0',
  minHeight: 'spacing.lg',
  padding: 'spacing.sm',
  borderRadius: 'radii.xs',
  backgroundColor: 'transparent',
  color: 'gray.700',
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
      color: 'gray.900',
    })
  ),
  
  heading2: cx(
    baseBlockStyle,
    css({
      textStyle: 'display-medium20',
      fontWeight: 'bold',
      color: 'gray.900',
    })
  ),
  
  heading3: cx(
    baseBlockStyle,
    css({
      textStyle: 'display-medium16',
      fontWeight: 'bold',
      color: 'gray.900',
    })
  ),
  
  unorderedList: cx(
    baseBlockStyle,
    css({
      listStyleType: 'disc',
      listStylePosition: 'inside',
      display: 'block',
    })
  ),
  
  orderedList: cx(
    baseBlockStyle,
    css({
      listStyleType: 'decimal',
      listStylePosition: 'inside',
      display: 'block',
    })
  ),
  
  listItem: css({
    margin: '0',
    padding: '0 0 0 spacing.md',
    outline: 'none',
    textStyle: 'display-medium16',
    color: 'gray.700',
    display: 'list-item', // 리스트 아이템으로 표시되도록 설정
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
      color: 'gray.500',
    })
  ),
};
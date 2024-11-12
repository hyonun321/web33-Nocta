import { defineRecipe } from "@pandacss/dev";

export const editorRecipe = defineRecipe({
  className: 'editor',
  base: {
    marginLeft: '100px',
    color: 'gray.900',
  },
  variants: {
    type: {
      base: {
        width: 'full',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        textStyle: 'display-medium16', // 기본 텍스트 스타일 적용
      },
      paragraph: {
        width: 'full',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        textStyle: 'display-medium16',
      },
      heading1: {
        width: 'full',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        textStyle: 'display-medium24', // 큰 제목용 텍스트 스타일
        fontWeight: 'bold',
      },
      heading2: {
        width: 'full',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        textStyle: 'display-medium20', // 중간 제목용 텍스트 스타일
        fontWeight: 'bold',
      },
      heading3: {
        width: 'full',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        textStyle: 'display-medium16', // 작은 제목용 텍스트 스타일
        fontWeight: 'bold',
      },
      unorderedList: {
        width: 'full',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        listStyleType: 'disc',
        textStyle: 'display-medium16',
      },
      orderedList: {
        width: 'full',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        listStyleType: 'decimal',
        textStyle: 'display-medium16',
      },
      listItem: {
        margin: '0',
        padding: '0',
        outline: 'none',
        textStyle: 'display-medium16',
      },
      input: {
        margin: 'spacing.sm 0',
        textStyle: 'display-medium16',
      },
      blockquote: {
        width: '1000px',
        margin: 'spacing.sm 0',
        minHeight: 'spacing.lg',
        padding: 'spacing.sm',
        borderRadius: 'radii.xs',
        backgroundColor: 'gray.100',
        outline: 'none',
        borderLeft: '4px solid token(colors.gray.300)',
        paddingLeft: 'spacing.md',
        fontStyle: 'italic',
        color: 'gray.700',
        textStyle: 'display-medium16',
      },
    }
  },
  defaultVariants: {
    type: 'base'
  }
})
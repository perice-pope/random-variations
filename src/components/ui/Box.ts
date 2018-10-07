import styled from 'react-emotion'
import * as ss from './styleSystem'

export type BoxProps = ss.SizeProps &
  ss.ColorProps &
  ss.SpaceProps &
  ss.BorderProps &
  ss.BorderColorProps &
  ss.BorderRadiusProps &
  ss.WidthProps &
  ss.HeightProps &
  ss.FlexProps &
  ss.DisplayProps &
  ss.JustifyContentProps &
  ss.OpacityProps &
  ss.PositionProps &
  ss.AlignItemsProps &
  ss.LeftProps &
  ss.TopProps &
  ss.RightProps &
  ss.BottomProps &
  ss.ZIndexProps

export const Box = styled('div')<BoxProps>`
  ${ss.size}
  ${ss.color}
  ${ss.space}
  ${ss.borders}
  ${ss.borderColor}
  ${ss.borderRadius}
  ${ss.width}
  ${ss.height}
  ${ss.flex}
  ${ss.display}
  ${ss.justifyContent}
  ${ss.opacity}
  ${ss.position}
  ${ss.alignItems}
  ${ss.left}
  ${ss.top}
  ${ss.bottom}
  ${ss.right}
  ${ss.zIndex}
  box-sizing: border-box;
`

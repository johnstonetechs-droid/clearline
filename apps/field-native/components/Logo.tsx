import Svg, { Rect, Path, Line, Circle } from 'react-native-svg';
import { palette } from '@clearwire/brand';

type Props = { size?: number };

// Mirror of clearwire-website/public/favicon.svg so the app carries the
// same mark as the website. Colors come from the shared palette.
export function Logo({ size = 48 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={5} fill={palette.navy900} />
      <Path
        d="M5 22 L5 10 Q5 8 7 8 L25 8 Q27 8 27 10 L27 22"
        fill="none"
        stroke={palette.blue600}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1={8}
        y1={22}
        x2={24}
        y2={22}
        stroke={palette.blue600}
        strokeWidth={2}
        strokeDasharray="3 2"
        strokeLinecap="round"
      />
      <Circle cx={27} cy={22} r={3} fill={palette.blue600} />
      <Circle
        cx={5}
        cy={22}
        r={3}
        fill={palette.navy900}
        stroke={palette.white}
        strokeWidth={2}
      />
    </Svg>
  );
}

import React from "react";
import Svg, { Path } from "react-native-svg";

export default function PlutoLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="260 115 275 370">
      <Path
        fillRule="evenodd"
        fill="#ffffff"
        d="m282.64 422.17l78.54 45.02v-241.12l77.54-45.52v90.05l-75.77 43.63 75.73 45.05 78.53-46.13v-88.82l-156.41-90.75-78.52 44.19z"
      />
    </Svg>
  );
}

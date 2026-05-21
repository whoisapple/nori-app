import { View, Text, Image } from "react-native";
import type { ImageSourcePropType } from "react-native";

interface AvatarStackProps {
  images: ImageSourcePropType[];
  size?: number;
  overlap?: number;
  maxDisplay?: number;
  moreText?: string;
}

export function AvatarStack({
  images,
  size = 32,
  overlap = 12,
  maxDisplay = 4,
  moreText = "+32",
}: AvatarStackProps) {
  const displayImages = images.slice(0, maxDisplay);
  const hasMore = images.length > maxDisplay;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 12 }}>
      {displayImages.map((source, index) => (
        <Image
          key={index}
          source={source}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: index > 0 ? -overlap : 0,
            borderWidth: 2,
            borderColor: "#f9f9ff",
          }}
        />
      ))}
      {hasMore && (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: -overlap,
            backgroundColor: "#f2f2fc",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#f9f9ff",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "500", color: "#6b7280" }}>{moreText}</Text>
        </View>
      )}
    </View>
  );
}

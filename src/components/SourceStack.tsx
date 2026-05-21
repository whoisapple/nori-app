import { Image, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";

type SourceStackProps = {
  images: ImageSourcePropType[];
  labels: string[];
  count: number;
  size?: number;
  overlap?: number;
  maxDisplay?: number;
};

export function SourceStack({ images, labels, count, size = 32, overlap = 12, maxDisplay = 4 }: SourceStackProps) {
  const displayCount = Math.min(Math.max(images.length, labels.length, count), maxDisplay);
  const hiddenCount = Math.max(count - displayCount, 0);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: hiddenCount > 0 ? 0 : overlap }}>
      {Array.from({ length: displayCount }, (_, index) => {
        const image = images[index];
        const label = labels[index] ?? "매체";

        return (
          <View
            key={`${label}-${index}`}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index > 0 ? -overlap : 0,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: "#f9f9ff",
              backgroundColor: "#f2f2fc",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {image ? (
              <Image source={image} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Text style={{ fontSize: size * 0.34, fontWeight: "700", color: "#69697c" }}>{label.slice(0, 1).toUpperCase()}</Text>
            )}
          </View>
        );
      })}
      {hiddenCount > 0 && (
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
          <Text style={{ fontSize: size * 0.32, fontWeight: "500", color: "#47475c" }}>{`+${hiddenCount}`}</Text>
        </View>
      )}
    </View>
  );
}

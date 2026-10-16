import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface ProductImageProps {
  uri: string;
  style?: ViewStyle;
  iconSize?: number;
}

/** Shows the product photo, or a neutral placeholder when there is no URL or the image fails to load. */
export function ProductImage({ uri, style, iconSize = 36 }: ProductImageProps) {
  const { colors } = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = uri.trim().length > 0 && failedUri !== uri;

  return (
    <View style={[styles.box, { backgroundColor: colors.surfaceAlt }, style]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFailedUri(uri)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Ionicons name="image-outline" size={iconSize} color={colors.textMuted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: radius.md },
});

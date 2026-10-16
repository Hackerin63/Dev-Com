import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Tabs, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LoadingView } from '@/components/LoadingView';
import { ProductImage } from '@/components/ProductImage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { CATEGORIES } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { createProduct, getProduct, prepareProductImage, updateProduct } from '@/services/productService';
import { friendlyError } from '@/utils/errors';
import { parseNumber, validateUrl } from '@/utils/validation';

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? String(id) : null;
  // Keyed so switching between "add" and "edit" always starts with a fresh form.
  return <ProductForm key={editingId ?? 'new'} editingId={editingId} />;
}

function ProductForm({ editingId }: { editingId: string | null }) {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(!!editingId);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [savedImageUrl, setSavedImageUrl] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [selectedImageDimensions, setSelectedImageDimensions] = useState({ width: 0, height: 0 });
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);

  // When editing, load the product once and fill the form.
  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    getProduct(editingId)
      .then((product) => {
        if (cancelled) return;
        if (!product) {
          Alert.alert('Product not found', 'It may have been deleted.');
          router.back();
          return;
        }
        setName(product.name);
        if (product.imageUrl.startsWith('data:image/')) {
          setSavedImageUrl(product.imageUrl);
          setImageUrl('');
        } else {
          setImageUrl(product.imageUrl);
        }
        setDescription(product.description);
        setPrice(String(product.price));
        setDiscountPercent(product.discountPercent > 0 ? String(product.discountPercent) : '');
        setStock(String(product.stock));
        setCategory(product.category);
      })
      .catch((e) => {
        if (!cancelled) {
          Alert.alert('Could not load the product', friendlyError(e));
          router.back();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  async function save() {
    const priceValue = parseNumber(price);
    const discountValue = discountPercent.trim() ? parseNumber(discountPercent) : 0;
    const stockValue = parseNumber(stock);
    const next = {
      name: name.trim().length < 2 ? 'Enter a product name.' : null,
      imageUrl: selectedImageUri ? null : validateUrl(imageUrl),
      price: priceValue === null || priceValue <= 0 ? 'Enter a price greater than 0.' : null,
      discountPercent:
        discountValue === null || discountValue < 0 || discountValue > 100
          ? 'Enter a discount from 0 to 100%.'
          : null,
      stock:
        stockValue === null || stockValue < 0 || !Number.isInteger(stockValue)
          ? 'Enter a whole number, 0 or more.'
          : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || priceValue === null || discountValue === null || stockValue === null) return;

    setBusy(true);
    try {
      const nextImageUrl = selectedImageUri
        ? await prepareProductImage(
            selectedImageUri,
            selectedImageDimensions.width,
            selectedImageDimensions.height,
          )
        : imageUrl.trim() || savedImageUrl;
      const input = {
        name,
        description,
        price: Math.round(priceValue * 100) / 100,
        discountPercent: discountValue,
        category,
        imageUrl: nextImageUrl,
        stock: stockValue,
      };
      if (editingId) await updateProduct(editingId, input);
      else await createProduct(input);
      router.back();
    } catch (e) {
      Alert.alert('Could not save the product', friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to choose a product image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      setSelectedImageDimensions({ width: asset.width, height: asset.height });
      setSavedImageUrl('');
      setImageUrl('');
      setErrors((current) => ({ ...current, imageUrl: null }));
    }
  }

  if (loading) return <LoadingView />;

  return (
    <Screen scroll bottomInset>
      <Tabs.Screen options={{ title: editingId ? 'Edit product' : 'Add product' }} />
      <ProductImage uri={selectedImageUri || imageUrl || savedImageUrl} style={styles.preview} iconSize={48} />
      <Text style={[typography.small, styles.label, { color: colors.textMuted }]}>Product image (optional)</Text>
      <TextField
        label="Image URL"
        value={imageUrl}
        onChangeText={(value) => {
          setImageUrl(value);
          setSelectedImageUri('');
          setSavedImageUrl('');
        }}
        error={errors.imageUrl}
        autoCapitalize="none"
        keyboardType="url"
        maxLength={2000}
        placeholder="https://…"
      />
      <View style={styles.imageActions}>
        <Button title="Choose from device" variant="secondary" icon="image-outline" onPress={chooseImage} />
        {selectedImageUri || savedImageUrl || imageUrl ? (
          <Button
            title="Clear image"
            variant="ghost"
            icon="close-circle-outline"
            onPress={() => {
              setSelectedImageUri('');
              setSavedImageUrl('');
              setImageUrl('');
            }}
          />
        ) : null}
      </View>
      <TextField label="Product name" value={name} onChangeText={setName} error={errors.name} maxLength={120} />
      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
        placeholder="What makes this product worth buying?"
      />

      <Text style={[typography.small, styles.label, { color: colors.textMuted }]}>Category</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((item) => {
          const selected = category === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCategory(item)}
              style={[
                styles.category,
                {
                  backgroundColor: selected ? colors.primarySoft : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>{item}</Text>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={selected ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label="Price" value={price} onChangeText={setPrice} error={errors.price} keyboardType="decimal-pad" />
        </View>
        <View style={styles.flex}>
          <TextField label="Stock" value={stock} onChangeText={setStock} error={errors.stock} keyboardType="number-pad" />
        </View>
      </View>
      <TextField
        label="Discount (%) (optional)"
        value={discountPercent}
        onChangeText={setDiscountPercent}
        error={errors.discountPercent}
        keyboardType="decimal-pad"
        placeholder="0"
      />

      <Button title={editingId ? 'Save changes' : 'Add product'} onPress={save} loading={busy} />
      <Button title="Cancel" variant="ghost" onPress={() => router.back()} style={styles.cancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  preview: { width: '100%', height: 180, marginBottom: spacing.lg },
  label: { fontWeight: '600', marginBottom: spacing.xs },
  imageActions: { gap: spacing.sm, marginBottom: spacing.lg },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  category: {
    minHeight: 48,
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  row: { flexDirection: 'row', gap: spacing.md },
  cancel: { marginTop: spacing.sm },
});

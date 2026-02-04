# Fix: Safari Animation Leak to Parent Element

## Thông tin

- **Commit**: `1670f22`
- **Page**: `/workflows/[id]`
- **Browser**: Safari only

## Triệu chứng

Toàn bộ content area bị xoay tròn (CSS transform rotate) trên Safari. Header và sidebar bình thường.

## Nguyên nhân

Safari WebKit bug: Khi component có CSS animation (`animate-spin`) re-render liên tục, animation transform có thể bị apply lên parent element.

### Code gây lỗi

```tsx
function Page() {
  const { data, isLoading } = useQuery();
  const { mutate1 } = useMutation1();  // trigger re-render
  const { mutate2 } = useMutation2();  // trigger re-render

  if (isLoading) {
    return <div className="animate-spin" />;  // animation inline
  }
  return <UI />;
}
```

- 3 hooks ở page level → nhiều re-renders
- Animation inline trong component → bị ảnh hưởng bởi re-renders
- Safari mis-apply transform lên parent

## Fix

Tách animation vào component riêng không có hooks:

```tsx
function Page() {
  const { data, isLoading } = useQuery();

  if (isLoading) return <LoadingState />;
  return <ContentWithMutations data={data} />;
}

function LoadingState() {
  return <div className="animate-spin" />;  // không re-render
}

function ContentWithMutations({ data }) {
  const { mutate1 } = useMutation1();
  const { mutate2 } = useMutation2();
  return <UI />;
}
```

## Pattern

1. Animation trong component riêng, không có hooks
2. Mutation hooks ở child components, không ở page level
3. Minimize hooks ở page level

## Tham khảo

- `git show 1670f22`

export function appIconMark(fontSize: number, rounded = true) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#007AFF',
        borderRadius: rounded ? '22%' : 0,
      }}
    >
      <span style={{ fontSize, color: '#fff', fontWeight: 700, fontFamily: 'sans-serif' }}>
        24
      </span>
    </div>
  );
}

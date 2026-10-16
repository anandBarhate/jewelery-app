// Decodes "UHJvZHVjdDoxNjU=" -> { type: "Product", id: "165", readable: "Product:165" }
export function decodeSaleorId(relayId) {
  if (!relayId) return null;
  try {
    const raw = Buffer.from(relayId, 'base64').toString('utf-8');
    const [type, id] = raw.split(':');
    return { type, id, readable: raw };
  } catch {
    return { readable: relayId };
  }
}

// Encodes ("Product", 1) -> "UHJvZHVjdDox"
export function encodeSaleorId(type, numericId) {
  return Buffer.from(`${type}:${numericId}`).toString('base64');
}
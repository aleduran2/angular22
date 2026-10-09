// API falsa sin dependencias. Estado en memoria: se reinicia al reiniciar el proceso.
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { PRODUCTS, REVIEWS } from './data.mjs';

const PORT = Number(process.env.API_PORT ?? 3000);
const LATENCY_MS = Number(process.env.API_LATENCY ?? 250);
const DEMO_PASSWORD = 'angular22';

const sessions = new Map();
const orders = new Map();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });

const userFromRequest = (req) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  return token ? sessions.get(token) : undefined;
};

const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
};

function listProducts(query) {
  const q = (query.get('q') ?? '').trim().toLowerCase();
  const category = query.get('category') ?? '';
  const sort = SORTERS[query.get('sort')] ?? SORTERS.name;
  const page = Math.max(1, Number(query.get('page') ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(query.get('pageSize') ?? 6)));

  const filtered = PRODUCTS.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
      (!category || p.category === category),
  ).sort(sort);

  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
}

function validateOrder(body) {
  const errors = [];
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) errors.push({ field: 'items', message: 'El carrito está vacío' });

  for (const item of items) {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    if (!product)
      errors.push({ field: 'items', message: `Producto ${item.productId} inexistente` });
    else if (item.quantity > product.stock)
      errors.push({ field: 'items', message: `Sin stock suficiente de ${product.name}` });
  }

  // Reglas que solo conoce el servidor: sirven para practicar errores de servidor por campo.
  if (body.shipping?.zip === '0000')
    errors.push({ field: 'shipping.zip', message: 'No hacemos envíos a ese código postal' });
  if (body.coupon && body.coupon !== 'NG22')
    errors.push({ field: 'coupon', message: 'Cupón inválido o vencido' });

  return errors;
}

function createOrder(body, user) {
  const lines = body.items.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    product.stock -= item.quantity;
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const discount = body.coupon === 'NG22' ? Math.round(subtotal * 0.1) : 0;

  const order = {
    id: randomUUID().slice(0, 8),
    userEmail: user.email,
    items: lines,
    shipping: body.shipping,
    paymentMethod: body.paymentMethod,
    subtotal,
    discount,
    total: subtotal - discount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);
  return order;
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  const { method } = req;

  if (method === 'OPTIONS') return send(res, 204);
  if (url.searchParams.has('fail')) return send(res, 500, { message: 'Error forzado con ?fail' });

  if (method === 'GET' && path === '/health') return send(res, 200, { ok: true });

  if (method === 'GET' && path === '/categories')
    return send(res, 200, [...new Set(PRODUCTS.map((p) => p.category))].sort());

  if (method === 'GET' && path === '/products')
    return send(res, 200, listProducts(url.searchParams));

  const productMatch = path.match(/^\/products\/(\d+)(\/reviews)?$/);
  if (method === 'GET' && productMatch) {
    const id = Number(productMatch[1]);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return send(res, 404, { message: 'Producto no encontrado' });
    return send(res, 200, productMatch[2] ? (REVIEWS[id] ?? []) : product);
  }

  if (method === 'POST' && path === '/auth/login') {
    const { email, password } = await readJson(req);
    if (!email || password !== DEMO_PASSWORD)
      return send(res, 401, { message: 'Email o contraseña incorrectos' });
    const user = { email, name: email.split('@')[0] };
    const token = randomUUID();
    sessions.set(token, user);
    return send(res, 200, { token, user });
  }

  if (path === '/orders' && method === 'POST') {
    const user = userFromRequest(req);
    if (!user) return send(res, 401, { message: 'Sesión vencida. Volvé a iniciar sesión.' });
    const body = await readJson(req);
    const errors = validateOrder(body);
    if (errors.length) return send(res, 422, { message: 'Revisá los datos del pedido', errors });
    return send(res, 201, createOrder(body, user));
  }

  const orderMatch = path.match(/^\/orders\/([\w-]+)$/);
  if (method === 'GET' && orderMatch) {
    const order = orders.get(orderMatch[1]);
    return order ? send(res, 200, order) : send(res, 404, { message: 'Pedido no encontrado' });
  }

  return send(res, 404, { message: `Ruta no encontrada: ${method} ${path}` });
}

createServer((req, res) => {
  setTimeout(() => {
    route(req, res).catch((error) => send(res, 400, { message: error.message }));
  }, LATENCY_MS);
}).listen(PORT, () => {
  console.log(`Mock API en http://localhost:${PORT}/api (latencia ${LATENCY_MS}ms)`);
});

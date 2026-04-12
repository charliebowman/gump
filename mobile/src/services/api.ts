import * as SecureStore from 'expo-secure-store';

const API_BASE = __DEV__ ? 'http://192.168.1.114:8080/api' : 'https://your-production-url.com/api';
// const API_BASE = __DEV__ ? 'https://industry-void-bug-impressed.trycloudflare.com/api' : 'https://your-production-url.com/api';

let token: string | null = null;

export async function loadToken() {
  token = await SecureStore.getItemAsync('gump_token');
}

export async function getToken() {
  if (!token) await loadToken();
  return token;
}

export async function setToken(newToken: string | null) {
  token = newToken;
  if (newToken) {
    await SecureStore.setItemAsync('gump_token', newToken);
  } else {
    await SecureStore.deleteItemAsync('gump_token');
  }
}

export async function setUser(user: any) {
  if (user) {
    await SecureStore.setItemAsync('gump_user', JSON.stringify(user));
  } else {
    await SecureStore.deleteItemAsync('gump_user');
  }
}

export async function getUser() {
  const raw = await SecureStore.getItemAsync('gump_user');
  return raw ? JSON.parse(raw) : null;
}

async function api(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...opts, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// Auth
export async function login(email: string, password: string) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await setToken(data.token);
  await setUser(data);
  return data;
}

export async function register(username: string, email: string, password: string) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  await setToken(data.token);
  await setUser(data);
  return data;
}

export async function logout() {
  await setToken(null);
  await setUser(null);
}

// Media
export async function searchMedia(type: string, query: string) {
  return api(`/media/search?type=${type}&q=${encodeURIComponent(query)}`);
}

export async function getMedia(id: number) {
  return api(`/media/${id}`);
}

export async function addMedia(media: any) {
  return api('/media', {
    method: 'POST',
    body: JSON.stringify(media),
  });
}

// Reviews
export async function submitReview(mediaId: number, rating: number | null, body: string) {
  return api('/reviews', {
    method: 'POST',
    body: JSON.stringify({ media_id: mediaId, rating, body }),
  });
}

export async function getUserReviews(userId: number) {
  return api(`/users/${userId}/reviews`);
}

// Status
export async function setStatus(mediaId: number, status: string) {
  return api('/status', {
    method: 'POST',
    body: JSON.stringify({ media_id: mediaId, status }),
  });
}

export async function getUserStatuses(userId: number) {
  return api(`/users/${userId}/status`);
}

// Social
export async function getFeed(limit = 30) {
  return api(`/feed?limit=${limit}`);
}

export async function getProfile(userId: number) {
  return api(`/users/${userId}`);
}

export async function followUser(userId: number) {
  return api(`/follow/${userId}`, { method: 'POST' });
}

export async function unfollowUser(userId: number) {
  return api(`/follow/${userId}`, { method: 'DELETE' });
}

// Wall
export async function getWallPosts(userId: number) {
  return api(`/wall/${userId}`);
}

export async function postToWall(userId: number, body: string) {
  return api(`/wall/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

// Messages
export async function getConversations() {
  return api('/messages');
}

export async function getMessages(userId: number) {
  return api(`/messages/${userId}`);
}

export async function sendMessage(receiverId: number, body: string) {
  return api('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiver_id: receiverId, body }),
  });
}

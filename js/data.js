import { supabase } from "./supabaseClient.js";

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.href = 'login.html';
  return session.user;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

// 1. GET GAMES (Includes Tags)
export async function getGames() {
  await checkAuth();
  const { data, error } = await supabase.from('games').select('*');
  if (error) return [];

  return data.map(g => ({
    id: g.id,
    name: g.name,
    image: g.image,
    rating: g.rating,
    review: g.review,
    plays: g.plays,
    players: g.players || { min: null, max: null },
    playTime: g.play_time || { min: null, max: null },
    playHistory: g.play_history || {},
    tracking: g.tracking_type || { score: false, won: false }, 
    sessions: g.sessions || [],
    tags: g.tags || [] // New Field
  }));
}

// 2. ADD GAME
export async function addGame(gameObj) {
  const user = await checkAuth();
  const { data, error } = await supabase.from('games').insert([{
    user_id: user.id,
    name: gameObj.name,
    image: gameObj.image,
    rating: gameObj.rating,
    review: gameObj.review,
    players: gameObj.players,
    play_time: gameObj.playTime,
    play_history: gameObj.playHistory,
    plays: gameObj.plays,
    tracking_type: gameObj.tracking,
    sessions: [],
    tags: gameObj.tags // New Field
  }]).select();
  return data ? data[0] : null;
}

// 3. UPDATE GAME
export async function updateGame(gameObj) {
  await checkAuth();
  await supabase.from('games').update({
    name: gameObj.name,
    image: gameObj.image,
    rating: gameObj.rating,
    review: gameObj.review,
    players: gameObj.players,
    play_time: gameObj.playTime,
    play_history: gameObj.playHistory,
    plays: gameObj.plays,
    tracking_type: gameObj.tracking,
    sessions: gameObj.sessions,
    tags: gameObj.tags // New Field
  }).eq('id', gameObj.id);
}

// 4. DELETE GAME
export async function deleteGame(id) {
  await checkAuth();
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
}

// 5. UPLOAD IMAGE (New)
export async function uploadImage(file) {
  await checkAuth();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('game-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('game-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// 6. IMPORT/CLEAR
export async function importGames(gamesArray) {
  const user = await checkAuth();
  const formattedGames = gamesArray.map(g => ({
    user_id: user.id,
    name: g.name,
    image: g.image,
    rating: g.rating,
    review: g.review,
    players: g.players,
    play_time: g.playTime || g.play_time,
    play_history: g.playHistory || g.play_history,
    plays: g.plays,
    tracking_type: g.tracking || { score: false, won: false },
    sessions: g.sessions || [],
    tags: g.tags || []
  }));
  const { error } = await supabase.from('games').insert(formattedGames);
  if (error) throw error;
}

export async function clearAllGames() {
  const user = await checkAuth();
  const { error } = await supabase.from('games').delete().eq('user_id', user.id);
  if (error) throw error;
}

import { supabase } from "./supabaseClient.js";

// Check if user is logged in
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
  }
  return session.user;
}

// 1. GET GAMES (Now Async!)
export async function getGames() {
  await checkAuth();
  
  const { data, error } = await supabase
    .from('games')
    .select('*');

  if (error) {
    console.error("Error loading games:", error);
    return [];
  }

  // Map database columns back to your app's expected structure
  return data.map(g => ({
    id: g.id,
    name: g.name,
    image: g.image,
    rating: g.rating,
    review: g.review,
    plays: g.plays,
    // Database uses snake_case, your app uses camelCase
    players: g.players || { min: null, max: null },
    playTime: g.play_time || { min: null, max: null },
    playHistory: g.play_history || {},
    badges: [] // Badges are calculated on the fly, so we start empty
  }));
}

// 2. SAVE/ADD GAME
// Note: We change this to save ONE game at a time, not the whole array
export async function addGame(gameObj) {
  const user = await checkAuth();

  const { data, error } = await supabase
    .from('games')
    .insert([{
      user_id: user.id,
      name: gameObj.name,
      image: gameObj.image,
      rating: gameObj.rating,
      review: gameObj.review,
      players: gameObj.players,
      play_time: gameObj.playTime,
      play_history: gameObj.playHistory,
      plays: gameObj.plays
    }])
    .select();

  if (error) alert("Error saving game");
  return data ? data[0] : null;
}

// 3. UPDATE GAME
export async function updateGame(gameObj) {
  await checkAuth();

  const { error } = await supabase
    .from('games')
    .update({
      name: gameObj.name,
      image: gameObj.image,
      rating: gameObj.rating,
      review: gameObj.review,
      players: gameObj.players,
      play_time: gameObj.playTime,
      play_history: gameObj.playHistory,
      plays: gameObj.plays
    })
    .eq('id', gameObj.id);

  if (error) console.error(error);
}

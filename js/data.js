// 4. BULK IMPORT
export async function importGames(gamesArray) {
  const user = await getCurrentUser();
  
  // Format the data for the database
  const formattedGames = gamesArray.map(g => ({
    user_id: user.id,
    name: g.name,
    image: g.image,
    rating: g.rating,
    review: g.review,
    players: g.players,
    play_time: g.playTime,
    play_history: g.playHistory,
    plays: g.plays
  }));

  const { error } = await supabase
    .from('games')
    .insert(formattedGames);

  if (error) throw error;
}

// 5. DELETE EVERYTHING (Used before import to prevent duplicates)
export async function clearAllGames() {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('user_id', user.id);
    
  if (error) throw error;
}

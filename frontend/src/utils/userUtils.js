export const getUserDisplayName = (user) => {
  if (!user) return "Learner";
  if (user.fullName) return user.fullName;
  if (user.name) return user.name;
  if (user.username) return user.username;
  
  // Final fallback: derive from email
  if (user.email) {
    return user.email.split("@")[0];
  }
  
  return "Learner";
};

export const getUserInitials = (user) => {
  const name = getUserDisplayName(user);
  if (!name) return "CP";
  const parts = name.split(/[._\s]+/);
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const fs = require('fs');
let appCode = fs.readFileSync('App.tsx', 'utf-8');

// The user said:
/*
// ANTES
if (!profile.registrationCompleted) {
  setPendingCompletionUser(profile);
  navigate('/');
} else {
  setUser(profile);
  setIsLoggedIn(true);
  if (window.location.pathname === '/') {
    navigate('/dashboard');
  }
}

// DESPUÉS
if (!profile.registrationCompleted) {
  setPendingCompletionUser(profile);
  setIsLoggedIn(false);
} else {
  setUser(profile);
  setIsLoggedIn(true);
}
*/

const oldBlock = `          if (!profile.registrationCompleted) {
            setPendingCompletionUser(profile);
            navigate('/');
          } else {
            setUser(profile);
            setIsLoggedIn(true);
            if(window.location.pathname === '/') {
                navigate('/dashboard');
            }
          }`;

const newBlock = `          if (!profile.registrationCompleted) {
            setPendingCompletionUser(profile);
            setIsLoggedIn(false);
          } else {
            setUser(profile);
            setIsLoggedIn(true);
          }`;

appCode = appCode.replace(oldBlock, newBlock);

/*
// ANTES
setPendingCompletionUser(newUser);
navigate('/');

// DESPUÉS
setPendingCompletionUser(newUser);
setIsLoggedIn(false);
*/

const oldBlock2 = `          await createUserProfile(firebaseUser.uid, newUser);
          setPendingCompletionUser(newUser);
          navigate('/');`;

const newBlock2 = `          await createUserProfile(firebaseUser.uid, newUser);
          setPendingCompletionUser(newUser);
          setIsLoggedIn(false);`;

appCode = appCode.replace(oldBlock2, newBlock2);

fs.writeFileSync('App.tsx', appCode);

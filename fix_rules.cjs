const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

// Fix 1: users
code = code.replace(
/match \/users\/\{userId\} \{\n\s*allow read, list: if isOwner\(userId\) \|\| isTrainer\(\);\n\s*allow create: if isAuthenticated\(\) && isOwner\(userId\);\n\s*allow update: if isAuthenticated\(\) && \(isOwner\(userId\) \|\| isTrainer\(\)\);\n\s*allow delete: if isTrainer\(\);\n\s*\}/g,
`match /users/{userId} {
      allow read, list: if isOwner(userId) || isTrainer();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isTrainer() ||
        (isOwner(userId) && !request.resource.data.diff(resource.data)
          .affectedKeys().hasAny(['isTrainer', 'plan', 'gamification']));
      allow delete: if isTrainer();
    }`
);

// Fix 2: pendingAchievements
code = code.replace(
/match \/pendingAchievements\/\{docId\} \{\n\s*allow read, delete: if isTrainer\(\);\n\s*allow create: if isAuthenticated\(\);\n\s*\}/g,
`match /pendingAchievements/{docId} {
      allow read, delete: if isTrainer();
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.keys().hasAll(['userId', 'type', 'createdAt']) &&
        request.resource.data.keys().hasOnly(['userId', 'type', 'description', 'createdAt']);
    }`
);

// Fix 3: bookedSlots
code = code.replace(
/match \/bookedSlots\/\{slotId\} \{\n\s*allow read: if isAuthenticated\(\);\n\s*allow create: if isAuthenticated\(\) && request\.resource\.data\.bookedBy == request\.auth\.uid;\n\s*allow delete: if isAuthenticated\(\) && \(resource\.data\.bookedBy == request\.auth\.uid \|\| isTrainer\(\)\);\n\s*allow update: if isTrainer\(\);\n\s*\}/g,
`match /bookedSlots/{slotId} {
      allow read: if isTrainer() || (isAuthenticated() && resource.data.bookedBy == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.bookedBy == request.auth.uid;
      allow delete: if isAuthenticated() && (resource.data.bookedBy == request.auth.uid || isTrainer());
      allow update: if isTrainer();
    }`
);

// Fix 4a: community
code = code.replace(
/match \/community\/\{postId\} \{\n\s*allow read: if isAuthenticated\(\);\n\s*allow create: if isAuthenticated\(\) && request\.resource\.data\.authorId == request\.auth\.uid;\n\s*allow update: if isAuthenticated\(\) && \(\n\s*resource\.data\.authorId == request\.auth\.uid \|\|\n\s*isTrainer\(\) \|\|\n\s*request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['likes'\]\)\n\s*\);\n\s*allow delete: if isAuthenticated\(\) && \(resource\.data\.authorId == request\.auth\.uid \|\| isTrainer\(\)\);\n\s*\}/g,
`match /community/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isTrainer() ||
        (isAuthenticated() && resource.data.authorId == request.auth.uid &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'edited'])) ||
        (isAuthenticated() &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes']));
      allow delete: if isAuthenticated() && (resource.data.authorId == request.auth.uid || isTrainer());
    }`
);

fs.writeFileSync('firestore.rules', code);

const fs = require('fs');
let content = fs.readFileSync('components/views/HomeView.tsx', 'utf8');

// Replace both logos with the CSS filter
const search1 = `<img
            src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png"
            alt="TommyBox"
            className="h-10 object-contain"
          />`;
const replace1 = `<img
            src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png"
            alt="TommyBox"
            className="h-10 object-contain"
            style={{
              filter: 'brightness(0) saturate(100%) invert(27%) sepia(98%) saturate(600%) hue-rotate(210deg) brightness(90%) contrast(100%)'
            }}
          />`;
content = content.replace(search1, replace1);

const search2 = `<img
              src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png"
              alt="TommyBox Logo"
              className="h-24 md:h-32 mx-auto mb-8 animate-fade-in"
            />`;
const replace2 = `<img
              src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png"
              alt="TommyBox Logo"
              className="h-24 md:h-32 mx-auto mb-8 animate-fade-in"
              style={{
                filter: 'brightness(0) saturate(100%) invert(27%) sepia(98%) saturate(600%) hue-rotate(210deg) brightness(90%) contrast(100%)'
              }}
            />`;
content = content.replace(search2, replace2);

fs.writeFileSync('components/views/HomeView.tsx', content);

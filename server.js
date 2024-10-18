const fs = require('fs').promises;
const path = require('path');

async function setupPersistentStorage() {
  const PERSISTENT_STORAGE = process.env.PERSISTENT_STORAGE_PATH || '/data';
  
  // Define source and target directories
  const directories = {
    images: {
      source: path.join(__dirname, 'public', 'imagefiles'),
      target: path.join(PERSISTENT_STORAGE, 'imagefiles')
    },
    audio: {
      source: path.join(__dirname, 'public', 'audiofiles'),
      target: path.join(PERSISTENT_STORAGE, 'audiofiles')
    }
  };

  try {
    // Ensure persistent storage directory exists
    await fs.mkdir(PERSISTENT_STORAGE, { recursive: true });

    // Copy files for each directory
    for (const [key, dir] of Object.entries(directories)) {
      // Create target directory
      await fs.mkdir(dir.target, { recursive: true });

      // Read source directory
      const files = await fs.readdir(dir.source);

      // Copy each file if it doesn't exist in target
      for (const file of files) {
        const sourcePath = path.join(dir.source, file);
        const targetPath = path.join(dir.target, file);

        try {
          // Check if file exists in target
          await fs.access(targetPath);
        } catch {
          // File doesn't exist, copy it
          await fs.copyFile(sourcePath, targetPath);
          console.log(`Copied ${file} to persistent storage`);
        }
      }
    }

    // Update application to use persistent storage paths
    app.use('/imagefiles', express.static(directories.images.target));
    app.use('/audiofiles', express.static(directories.audio.target));

    console.log('Persistent storage setup complete');
  } catch (error) {
    console.error('Error setting up persistent storage:', error);
    throw error;
  }
}

// Add this to your server initialization
async function initializeServer() {
  await loadWordsData();
  await setupPersistentStorage();
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

initializeServer().catch(console.error);
/**
 * Automated Release Packager for TimeLab Chrome Extension
 * 
 * Steps:
 * 1. Runs `node scratch/test_full_suite.js` pre-flight gate.
 * 2. Parses `manifest.json` for target version.
 * 3. Cleans / creates `release/` directory.
 * 4. Staging: Copies only production files & assets into a clean staging folder.
 * 5. Validates that no test scripts, documentation, git metadata, or markdown files exist in staging.
 * 6. Compresses staging contents into `release/timelab-extension-v{version}.zip` via PowerShell Compress-Archive.
 * 7. Cleans up staging folder.
 * 8. Verifies zip archive integrity, reports member count and file size.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const STAGING_DIR = path.join(RELEASE_DIR, '_staging');

const PROD_FILES = [
    'manifest.json',
    'background.js',
    'content_issue.js',
    'content_request.js',
    'i18n.js',
    'utils.js',
    'sync.js',
    'icon16.png',
    'icon32.png',
    'icon48.png',
    'icon128.png'
];

const PROD_DIRS = [
    'popup',
    'page',
    'todo',
    'note',
    'media',
    'tutorial'
];

const EXCLUDED_PATTERNS = [
    /\.md$/i,
    /\.map$/i,
    /scratch/i,
    /docs/i,
    /\.git/i,
    /\.superpowers/i,
    /\.gitignore/i
];

function printBanner(title) {
    console.log('\n================================================================');
    console.log(`  ${title}`);
    console.log('================================================================');
}

function runPreflightTests() {
    printBanner('STEP 1: PRE-FLIGHT REGRESSION SUITE GATE');
    const suiteScript = path.join(ROOT_DIR, 'scratch', 'test_full_suite.js');
    console.log(`Running comprehensive test suite: ${suiteScript}...`);

    try {
        execFileSync(process.execPath, [suiteScript], {
            cwd: ROOT_DIR,
            stdio: 'inherit'
        });
        console.log('\n✔ Pre-flight gate passed! All regression suites and security checks green.');
    } catch (err) {
        console.error('\n✖ Pre-flight gate failed! Halting build process to prevent packaging broken code.');
        process.exit(1);
    }
}

function getManifestMetadata() {
    const manifestPath = path.join(ROOT_DIR, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`manifest.json not found at ${manifestPath}`);
    }
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    if (!manifest.version) {
        throw new Error('manifest.json is missing "version" property');
    }

    return {
        name: manifest.name || 'timelab-extension',
        version: manifest.version
    };
}

function prepareReleaseDirectory() {
    printBanner('STEP 2: PREPARING RELEASE DIRECTORY & STAGING');

    if (fs.existsSync(STAGING_DIR)) {
        fs.rmSync(STAGING_DIR, { recursive: true, force: true });
    }

    if (!fs.existsSync(RELEASE_DIR)) {
        fs.mkdirSync(RELEASE_DIR, { recursive: true });
        console.log(`Created directory: ${RELEASE_DIR}`);
    }

    fs.mkdirSync(STAGING_DIR, { recursive: true });
    console.log(`Created staging directory: ${STAGING_DIR}`);
}

function stageProductionFiles() {
    printBanner('STEP 3: STAGING PRODUCTION ARTIFACTS');

    // Copy top-level production files
    PROD_FILES.forEach(file => {
        const srcPath = path.join(ROOT_DIR, file);
        const destPath = path.join(STAGING_DIR, file);
        if (!fs.existsSync(srcPath)) {
            throw new Error(`Required production file missing: ${file}`);
        }
        fs.copyFileSync(srcPath, destPath);
        console.log(`  + [FILE] ${file}`);
    });

    // Copy production directories
    PROD_DIRS.forEach(dir => {
        const srcPath = path.join(ROOT_DIR, dir);
        const destPath = path.join(STAGING_DIR, dir);
        if (!fs.existsSync(srcPath)) {
            throw new Error(`Required production directory missing: ${dir}`);
        }
        fs.cpSync(srcPath, destPath, { recursive: true });
        console.log(`  + [DIR]  ${dir}/`);
    });

    // Verify exclusions
    function scanAndVerify(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(STAGING_DIR, fullPath).replace(/\\/g, '/');

            for (const pattern of EXCLUDED_PATTERNS) {
                if (pattern.test(relPath)) {
                    throw new Error(`Strict exclusion violation! Staging contains prohibited file: ${relPath}`);
                }
            }

            if (entry.isDirectory()) {
                scanAndVerify(fullPath);
            }
        }
    }

    scanAndVerify(STAGING_DIR);
    console.log('✔ All production files staged successfully. Zero prohibited files detected.');
}

function compressStaging(zipPath) {
    printBanner('STEP 4: COMPRESSING ARCHIVE');
    console.log(`Target Zip: ${zipPath}`);

    if (fs.existsSync(zipPath)) {
        console.log('Removing existing release archive...');
        fs.unlinkSync(zipPath);
    }

    // PowerShell Compress-Archive packaging staging contents
    const psScript = `Compress-Archive -Path '${STAGING_DIR}/*' -DestinationPath '${zipPath}' -Force`;
    console.log('Executing PowerShell Compress-Archive...');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });

    if (!fs.existsSync(zipPath)) {
        throw new Error(`Compress-Archive failed to create output at ${zipPath}`);
    }

    // Clean up staging directory
    fs.rmSync(STAGING_DIR, { recursive: true, force: true });
    console.log('Cleaned up staging directory.');
}

function verifyReleaseArchive(zipPath) {
    printBanner('STEP 5: VERIFYING RELEASE ARCHIVE INTEGRITY');

    const stats = fs.statSync(zipPath);
    const sizeInKb = (stats.size / 1024).toFixed(2);
    const sizeInMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`Archive file size: ${stats.size} bytes (${sizeInKb} KB / ${sizeInMb} MB)`);

    // Read members using PowerShell .NET ZipFile to be 100% platform-safe
    const psInspect = `Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath}'); $zip.Entries | ForEach-Object { $_.FullName + ' (' + $_.Length + ')' }; $zip.Dispose()`;
    const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', psInspect], {
        encoding: 'utf8'
    });

    const entries = output.trim().split(/\r?\n/)
        .map(line => line.trim().replace(/\\/g, '/'))
        .filter(line => line.length > 0);
    console.log(`Archive contains ${entries.length} entries:`);
    entries.forEach(e => console.log(`   • ${e}`));

    // Check that manifest.json is at root
    const hasRootManifest = entries.some(line => line.startsWith('manifest.json'));
    if (!hasRootManifest) {
        throw new Error('Integrity Check FAILED: manifest.json is NOT located at the archive root!');
    }

    // Check critical entries
    const criticalEntries = [
        'manifest.json',
        'background.js',
        'utils.js',
        'sync.js',
        'i18n.js',
        'content_issue.js',
        'content_request.js',
        'popup/popup.html',
        'popup/popup.js',
        'page/page.html',
        'page/page.js',
        'page/chart.umd.min.js',
        'page/exceljs.min.js',
        'todo/todo.html',
        'note/note.html'
    ];

    criticalEntries.forEach(item => {
        const found = entries.some(line => line.startsWith(item));
        if (!found) {
            throw new Error(`Integrity Check FAILED: Critical item missing from archive: ${item}`);
        }
    });

    console.log('✔ Integrity check PASSED: manifest.json is at archive root.');
    console.log('✔ All critical production assets verified inside the zip.');

    printBanner('RELEASE PACKAGE BUILD SUMMARY');
    console.log(`  Package:   ${path.basename(zipPath)}`);
    console.log(`  Location:  ${zipPath}`);
    console.log(`  Size:      ${sizeInKb} KB (${stats.size} bytes)`);
    console.log(`  Entries:   ${entries.length} files and directories`);
    console.log('\n  STATUS: READY FOR CHROME WEB STORE SUBMISSION! 🎉\n');
}

function main() {
    console.log('Starting automated TimeLab release packager...');
    runPreflightTests();

    const metadata = getManifestMetadata();
    console.log(`Targeting release version: v${metadata.version}`);

    const zipFileName = `timelab-extension-v${metadata.version}.zip`;
    const zipPath = path.join(RELEASE_DIR, zipFileName);

    prepareReleaseDirectory();
    stageProductionFiles();
    compressStaging(zipPath);
    verifyReleaseArchive(zipPath);
}

main();

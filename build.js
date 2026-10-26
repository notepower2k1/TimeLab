#!/usr/bin/env node

/**
 * Automated Build & Packaging System for TimeLab Extension
 * 
 * Supports two distinct editions:
 * 1. "public"  - Clean, unbranded personal / Chrome Web Store edition.
 *                Zero mention of "widosoft", zero company-specific permissions or templates.
 * 2. "company" - Company-customized edition for Widosoft internal workflow.
 *                Includes pre-configured Widosoft permissions, pills, and KPI Excel templates.
 * 
 * Usage:
 *   node build.js public
 *   node build.js company
 *   node build.js all
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname);
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const PROD_FILES = [
    'background.js',
    'i18n.js',
    'utils.js',
    'sync.js',
    'odoo.js',
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

const EXCLUDED_EXTENSIONS = ['.md', '.map', '.zip', '.log'];
const EXCLUDED_DIRS = ['scratch', 'docs', '.git', 'company', 'dist', 'release'];

function logBanner(text) {
    console.log('\n' + '='.repeat(64));
    console.log(`  ${text}`);
    console.log('='.repeat(64));
}

function getVersion() {
    const manifestPath = path.join(ROOT_DIR, 'manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.version || '1.0.0';
}

function cleanDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(src, dest, target) {
    const stats = fs.statSync(src);
    const basename = path.basename(src);

    if (EXCLUDED_DIRS.includes(basename)) return;

    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        for (const item of fs.readdirSync(src)) {
            copyRecursive(path.join(src, item), path.join(dest, item), target);
        }
    } else {
        const ext = path.extname(src).toLowerCase();
        if (EXCLUDED_EXTENSIONS.includes(ext)) return;

        // Skip company Excel template and company odoo module for public build
        if (target === 'public' && (basename === 'kpi_template.xlsx' || basename === 'odoo.js')) {
            return;
        }

        // Process text files through conditional compilation
        if (['.js', '.html', '.css'].includes(ext)) {
            let content = fs.readFileSync(src, 'utf8');
            content = preprocessCode(content, target);
            fs.writeFileSync(dest, content, 'utf8');
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}

function preprocessCode(code, target) {
    if (target === 'public') {
        // Strip company-specific blocks
        code = code.replace(/\/\*\s*@company-start\s*\*\/[\s\S]*?\/\*\s*@company-end\s*\*\//g, '');
        code = code.replace(/<!--\s*@company-start\s*-->[\s\S]*?<!--\s*@company-end\s*-->/g, '');

        // Unwrap public blocks (handles both commented-out /* @public-start ... @public-end */ and tagged /* @public-start */ ... /* @public-end */)
        code = code.replace(/\/\*\s*@public-start(?:\s*\*\/)?([\s\S]*?)(?:\/\*\s*)?@public-end\s*\*\//g, '$1');
        code = code.replace(/<!--\s*@public-start(?:\s*-->)?([\s\S]*?)(?:<!--\s*)?@public-end\s*-->/g, '$1');
    } else if (target === 'company') {
        // Strip public-specific blocks (both forms)
        code = code.replace(/\/\*\s*@public-start[\s\S]*?@public-end\s*\*\//g, '');
        code = code.replace(/<!--\s*@public-start[\s\S]*?@public-end\s*-->/g, '');

        // Unwrap company blocks
        code = code.replace(/\/\*\s*@company-start\s*\*\//g, '');
        code = code.replace(/\/\*\s*@company-end\s*\*\//g, '');
        code = code.replace(/<!--\s*@company-start\s*-->/g, '');
        code = code.replace(/<!--\s*@company-end\s*-->/g, '');
    }
    return code;
}

function generateManifest(target, destDir) {
    const srcManifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8'));

    if (target === 'public') {
        // Public Manifest: Strictly clean, standard host_permissions
        srcManifest.host_permissions = (srcManifest.host_permissions || [])
            .filter(p => !p.toLowerCase().includes('widosoft'));

        if (Array.isArray(srcManifest.content_scripts)) {
            srcManifest.content_scripts.forEach(cs => {
                if (Array.isArray(cs.matches)) {
                    cs.matches = cs.matches.filter(m => !m.toLowerCase().includes('widosoft'));
                }
            });
        }
    } else if (target === 'company') {
        // Company Manifest: Pre-configured with Widosoft hosts
        const companyHost = '*://gitlab.widosoft.com/*';
        if (!srcManifest.host_permissions.includes(companyHost)) {
            srcManifest.host_permissions.push(companyHost);
        }
        const odooHost = 'https://erp.widosoft.com/*';
        if (!srcManifest.host_permissions.includes(odooHost)) {
            srcManifest.host_permissions.push(odooHost);
        }

        if (Array.isArray(srcManifest.content_scripts)) {
            // Ensure issue/work_items match
            const issueScript = srcManifest.content_scripts[0];
            if (issueScript && Array.isArray(issueScript.matches)) {
                if (!issueScript.matches.includes('*://gitlab.widosoft.com/*/-/issues/*')) {
                    issueScript.matches.push('*://gitlab.widosoft.com/*/-/issues/*');
                }
                if (!issueScript.matches.includes('*://gitlab.widosoft.com/*/-/work_items/*')) {
                    issueScript.matches.push('*://gitlab.widosoft.com/*/-/work_items/*');
                }
            }

            // Ensure MR match
            const mrScript = srcManifest.content_scripts[1];
            if (mrScript && Array.isArray(mrScript.matches)) {
                if (!mrScript.matches.includes('*://gitlab.widosoft.com/*/-/merge_requests/*')) {
                    mrScript.matches.push('*://gitlab.widosoft.com/*/-/merge_requests/*');
                }
            }
        }
    }

    const destPath = path.join(destDir, 'manifest.json');
    fs.writeFileSync(destPath, JSON.stringify(srcManifest, null, 4), 'utf8');
}

function verifyZeroLeaks(dir) {
    const leaks = [];

    function scan(current) {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                scan(full);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (['.js', '.html', '.css', '.json'].includes(ext)) {
                    const content = fs.readFileSync(full, 'utf8');
                    const lines = content.split('\n');
                    lines.forEach((line, idx) => {
                        if (line.toLowerCase().includes('widosoft')) {
                            leaks.push({
                                file: path.relative(dir, full),
                                line: idx + 1,
                                text: line.trim()
                            });
                        }
                    });
                }
            }
        }
    }

    scan(dir);
    return leaks;
}

function createZipArchive(sourceDir, zipPath) {
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }

    try {
        execFileSync('zip', ['-q', '-r', zipPath, '.'], {
            cwd: sourceDir,
            stdio: 'inherit'
        });
    } catch (e) {
        // Fallback for Windows if powershell is available
        try {
            const psScript = `Compress-Archive -Path '${sourceDir}/*' -DestinationPath '${zipPath}' -Force`;
            execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], {
                stdio: 'inherit'
            });
        } catch (e2) {
            throw new Error(`Failed to create zip archive: ${e.message}`);
        }
    }

    if (!fs.existsSync(zipPath)) {
        throw new Error(`Zip archive was not generated at: ${zipPath}`);
    }

    const stat = fs.statSync(zipPath);
    return (stat.size / 1024).toFixed(1);
}

function buildTarget(target) {
    const version = getVersion();
    const targetDir = path.join(DIST_DIR, target);
    const zipName = `TimeLab-v${version}-${target}.zip`;
    const zipPath = path.join(DIST_DIR, zipName);

    logBanner(`BUILDING TARGET: [${target.toUpperCase()}] (v${version})`);

    // 1. Clean destination
    console.log(`Preparing clean directory: ${targetDir}`);
    cleanDir(targetDir);

    // 2. Copy root files
    for (const file of PROD_FILES) {
        const srcPath = path.join(ROOT_DIR, file);
        const destPath = path.join(targetDir, file);
        if (fs.existsSync(srcPath)) {
            copyRecursive(srcPath, destPath, target);
        }
    }

    // 3. Copy production directories
    for (const dir of PROD_DIRS) {
        const srcPath = path.join(ROOT_DIR, dir);
        const destPath = path.join(targetDir, dir);
        if (fs.existsSync(srcPath)) {
            copyRecursive(srcPath, destPath, target);
        }
    }

    // 4. Ensure company template is in company build
    if (target === 'company') {
        const templateSrc = path.join(ROOT_DIR, 'company', 'kpi_template.xlsx');
        const templateDest = path.join(targetDir, 'page', 'kpi_template.xlsx');
        if (fs.existsSync(templateSrc)) {
            fs.copyFileSync(templateSrc, templateDest);
            console.log('✔ Included company KPI template: page/kpi_template.xlsx');
        }
    }

    // 5. Generate tailored manifest.json
    generateManifest(target, targetDir);
    console.log('✔ Generated tailored manifest.json');

    // 6. Security Audit: Zero Leaks Verification for public build
    if (target === 'public') {
        console.log('\nRunning automated Zero-Leaks verification audit...');
        const leaks = verifyZeroLeaks(targetDir);
        if (leaks.length > 0) {
            console.error('\n✖ SECURITY AUDIT FAILED! Found prohibited occurrences of "widosoft":');
            leaks.forEach(l => {
                console.error(`  - ${l.file}:${l.line} -> ${l.text}`);
            });
            throw new Error(`Zero-leak verification failed with ${leaks.length} violations.`);
        }
        console.log('✔ ZERO LEAKS VERIFIED: 0 occurrences of "widosoft" in public build! 🛡️');
    }

    // 7. Compress into release zip
    const sizeKb = createZipArchive(targetDir, zipPath);
    console.log(`\n✔ Package created: dist/${zipName} (${sizeKb} KB)`);
    console.log(`✔ Unpacked directory: dist/${target}/`);
}

function watchTarget(target) {
    console.log(`\n👀 Watching for changes to recompile [${target}]... (Ctrl+C to stop)`);
    let debounceTimer = null;
    const trigger = (filename) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log(`\n[${new Date().toLocaleTimeString()}] File change detected (${filename || ''}), rebuilding...`);
            try {
                buildTarget(target);
                console.log(`✔ Rebuilt dist/${target}/ successfully.`);
            } catch (err) {
                console.error('❌ Build failed:', err.message);
            }
        }, 200);
    };

    const watchDirs = ['.', 'page', 'popup', 'todo', 'note', 'media', 'tutorial', 'company'];
    watchDirs.forEach(d => {
        const fullPath = path.join(ROOT_DIR, d);
        if (fs.existsSync(fullPath)) {
            try {
                fs.watch(fullPath, (eventType, filename) => {
                    if (!filename) return;
                    if (filename.startsWith('.') || filename.endsWith('~')) return;
                    if (['dist', 'release', 'scratch', 'docs'].some(ex => filename.includes(ex))) return;
                    const ext = path.extname(filename).toLowerCase();
                    if (['.js', '.html', '.css', '.json', '.xlsx', '.png'].includes(ext)) {
                        trigger(filename);
                    }
                });
            } catch (e) {}
        }
    });
}

function main() {
    const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');
    const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
    const arg = (args[0] || 'all').toLowerCase();

    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    if (arg === 'public') {
        buildTarget('public');
        if (isWatch) watchTarget('public');
    } else if (arg === 'company') {
        buildTarget('company');
        if (isWatch) watchTarget('company');
    } else if (arg === 'all') {
        buildTarget('public');
        buildTarget('company');
        if (isWatch) watchTarget('company');
    } else {
        console.error(`Invalid target: ${arg}. Use "public", "company", or "all".`);
        process.exit(1);
    }

    if (!isWatch) {
        logBanner('BUILD COMPLETED SUCCESSFULLY! 🎉');
        console.log('Summary:');
        console.log('  - dist/public/   -> Sạch 100%, không có bất kỳ thông tin widosoft, sẵn sàng cho Chrome Web Store.');
        console.log('  - dist/company/  -> Tối ưu hóa cho công ty, có sẵn domain widosoft và mẫu Excel.');
    }
}

main();

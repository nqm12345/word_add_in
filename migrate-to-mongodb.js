/**
 * Script migrate dữ liệu từ File System sang MongoDB
 */

const fs = require('fs').promises;
const path = require('path');
const {
    connectDB,
    uploadFile,
    listFiles
} = require('./server/database');

const DOCUMENTS_DIR = path.join(__dirname, 'server', 'documents');

async function migrate() {
    console.log('🚀 Bắt đầu migrate dữ liệu...\n');
    
    try {
        // Kết nối MongoDB
        console.log('📡 Đang kết nối MongoDB...');
        await connectDB();
        console.log('✅ Đã kết nối MongoDB\n');
        
        // Kiểm tra xem đã có data trong MongoDB chưa
        const existingFiles = await listFiles();
        if (existingFiles.length > 0) {
            console.log(`⚠️  MongoDB đã có ${existingFiles.length} file!`);
            console.log('Danh sách file:');
            existingFiles.forEach(file => {
                console.log(`  - ${file.filename} (${Math.round(file.length / 1024)} KB)`);
            });
            console.log('\n❓ Có muốn xóa và import lại không? (y/n)');
            
            // Nếu chạy từ script, mặc định là skip
            console.log('⏭️  Skipping... (Nếu muốn xóa và import lại, chỉnh sửa script này)\n');
        }
        
        // Đọc danh sách file từ thư mục
        console.log(`📂 Đang quét thư mục: ${DOCUMENTS_DIR}`);
        const files = await fs.readdir(DOCUMENTS_DIR);
        const docxFiles = files.filter(file => file.endsWith('.docx'));
        
        if (docxFiles.length === 0) {
            console.log('⚠️  Không tìm thấy file .docx nào trong thư mục!');
            console.log('   Có thể bạn chưa có file nào, hoặc file đang ở nơi khác.\n');
            return;
        }
        
        console.log(`✅ Tìm thấy ${docxFiles.length} file .docx\n`);
        
        // Upload từng file
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        
        for (const filename of docxFiles) {
            try {
                // Kiểm tra file đã tồn tại trong MongoDB chưa
                const existing = existingFiles.find(f => f.filename === filename);
                if (existing) {
                    console.log(`⏭️  Skip: ${filename} (đã tồn tại)`);
                    skipCount++;
                    continue;
                }
                
                // Đọc file
                const filePath = path.join(DOCUMENTS_DIR, filename);
                const fileBuffer = await fs.readFile(filePath);
                const stats = await fs.stat(filePath);
                
                // Upload vào MongoDB
                console.log(`📤 Uploading: ${filename} (${Math.round(fileBuffer.length / 1024)} KB)...`);
                
                const result = await uploadFile(fileBuffer, filename, {
                    uploadedBy: 'Migration Script',
                    originalPath: filePath,
                    migratedAt: new Date(),
                    originalModified: stats.mtime
                });
                
                console.log(`   ✅ Success: ${result.fileId}\n`);
                successCount++;
                
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
                errorCount++;
            }
        }
        
        // Tóm tắt
        console.log('═══════════════════════════════════════════════');
        console.log('📊 KẾT QUẢ MIGRATION:');
        console.log('═══════════════════════════════════════════════');
        console.log(`✅ Thành công: ${successCount} file`);
        console.log(`⏭️  Đã skip: ${skipCount} file (đã tồn tại)`);
        console.log(`❌ Lỗi: ${errorCount} file`);
        console.log(`📁 Tổng cộng: ${docxFiles.length} file`);
        console.log('═══════════════════════════════════════════════\n');
        
        if (successCount > 0) {
            console.log('🎉 Migration hoàn tất!');
            console.log('\n📋 Bước tiếp theo:');
            console.log('   1. Stop server cũ (Ctrl+C)');
            console.log('   2. Start server MongoDB: npm run start:mongo');
            console.log('   3. Mở browser: https://wordserver.local:3000/index-msword.html');
            console.log('   4. Kiểm tra danh sách file\n');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

// Chạy migration
migrate();

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * PDF 파일 생성을 담당하는 클래스
 */
class PDFReportService {
    generatePDFReport(analysisResults, outputPath) {
        const doc = new PDFDocument({
            autoFirstPage: false,
            bufferPages: true
        });

        doc.pipe(fs.createWriteStream(outputPath));
        const fontPath = path.join(__dirname, '../../../resource/NanumGothicCoding-2.5/NanumGothicCoding.ttf');

        try {
            doc.registerFont('NanumGothicCoding', fontPath);
        } catch (error) {
            console.error('폰트 등록 실패:', error);
            console.log('기본 폰트로 대체합니다.');
        }

        analysisResults.forEach(result => {
            doc.addPage({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            })
            .fontSize(12)
            .font('NanumGothicCoding')
            .text(`커밋 SHA: ${result.commitSHA}`, { underline: true })
            .moveDown()
            .text(`커밋 메시지: ${result.commitMessage}`)
            .moveDown()
            .text("커밋 분석 결과:")
            .moveDown()
            .text(result.aiAnalysis, {
                align: 'justify',
                lineGap: 3
            });
        });

        doc.end();
        console.log(`PDF 파일이 생성되었습니다: ${outputPath}`);
    }
}

export default PDFReportService;

/**
 * Newsletter API Module
 */
import { firebaseDB } from '../../core/app-init.js';
import { AdminUtils } from '../../core/utils.js';
import { state } from './state.js';

/**
 * 선교사 목록 로드 (검색용)
 */
export async function loadMissionaries() {
    state.missionaries = await firebaseDB.getMissionaries();
    return state.missionaries;
}

/**
 * PDF 파일 업로드
 */
export async function uploadPDF(missionaryId, file) {
    if (!file) return null;
    const storage = firebase.storage();
    const timestamp = Date.now();
    const pdfRef = storage.ref().child(`newsletters/${missionaryId}/${timestamp}_${file.name}`);
    const snapshot = await pdfRef.put(file);
    return await snapshot.ref.getDownloadURL();
}

/**
 * 뉴스레터 통합 업로드 및 선교사 정보 업데이트
 */
export async function uploadNewsletter(missionaryId, data) {
    try {
        state.uploading = true;

        const { title, summary, pdfFile, photoFiles } = data;

        // 1. PDF 업로드
        let pdfUrl = '';
        if (pdfFile) {
            pdfUrl = await uploadPDF(missionaryId, pdfFile);
        }

        // 2. 사역사진 업로드 (압축 포함)
        const photoUrls = [];
        for (let i = 0; i < photoFiles.length; i++) {
            const file = photoFiles[i];
            const timestamp = Date.now();
            const path = `missionaries/${missionaryId}/ministry_${timestamp}_${i}.jpg`;
            const downloadURL = await AdminUtils.uploadImage(file, path);
            if (downloadURL) photoUrls.push(downloadURL);
        }

        // 3. 선교사 데이터 매핑
        const updateData = {
            summary: summary,
            summaryPrayer: summary,
            prayerTopic: summary,
            latestNewsletterDate: new Date().toISOString().split('T')[0]
        };

        if (photoUrls.length > 0) updateData.ministryPhotos = photoUrls;
        if (pdfUrl) {
            updateData.newsletterUrl = pdfUrl;
            updateData.NewsLetter = pdfUrl; // 레거시 호환
        }
        if (title) updateData.newsletterTitle = title;

        // 4. DB 반영
        await firebaseDB.updateMissionary(missionaryId, updateData);

        return true;
    } catch (error) {
        console.error('Newsletter upload API error:', error);
        throw error;
    } finally {
        state.uploading = false;
    }
}

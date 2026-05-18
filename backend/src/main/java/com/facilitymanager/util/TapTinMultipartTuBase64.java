package com.facilitymanager.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

/**
 * Chuyển chuỗi ảnh Base64 (data URL) thành {@link MultipartFile} để tái dùng luồng upload hiện có.
 */
public class TapTinMultipartTuBase64 implements MultipartFile {

    private static final String DAU_PHAN_CACH_PHAN_MO_RONG = ".";
    private static final String DAU_PHAN_CACH_HEADER = ";";
    private static final String DAU_PHAN_CACH_LOAI = "/";
    private static final String DAU_PHAN_CACH_MIME = ":";
    private static final String DAU_PHAN_CACH_DATA = ",";

    private final byte[] noiDungAnh;
    private final String phanHeader;

    public TapTinMultipartTuBase64(byte[] noiDungAnh, String phanHeader) {
        this.noiDungAnh = noiDungAnh;
        this.phanHeader = phanHeader.split(DAU_PHAN_CACH_HEADER)[0];
    }

    public static MultipartFile tuChuoiBase64(String chuoiBase64) {
        if (TienIchChuoi.laRong(chuoiBase64) || !chuoiBase64.contains(DAU_PHAN_CACH_DATA)) {
            throw new IllegalArgumentException("Chuỗi Base64 không hợp lệ");
        }
        String[] phan = chuoiBase64.split(DAU_PHAN_CACH_DATA, 2);
        byte[] bytes = Base64.getDecoder().decode(phan[1]);
        for (int i = 0; i < bytes.length; i++) {
            if (bytes[i] < 0) {
                bytes[i] += 256;
            }
        }
        return new TapTinMultipartTuBase64(bytes, phan[0]);
    }

    @Override
    public long getSize() {
        return noiDungAnh.length;
    }

    @Override
    public InputStream getInputStream() {
        return new ByteArrayInputStream(noiDungAnh);
    }

    @Override
    public byte[] getBytes() {
        return noiDungAnh;
    }

    @Override
    public String getName() {
        return tenFileNgauNhien();
    }

    @Override
    public String getOriginalFilename() {
        return tenFileNgauNhien();
    }

    @Override
    public String getContentType() {
        String[] phan = phanHeader.split(DAU_PHAN_CACH_MIME);
        return phan.length > 1 ? phan[1] : "application/octet-stream";
    }

    @Override
    public boolean isEmpty() {
        return noiDungAnh == null || noiDungAnh.length == 0;
    }

    @Override
    public void transferTo(File dich) throws IOException {
        try (FileOutputStream out = new FileOutputStream(dich)) {
            out.write(noiDungAnh);
        }
    }

    private String tenFileNgauNhien() {
        String duoi = layDuoiTuHeader();
        return System.currentTimeMillis() + "_" + (int) (Math.random() * 10000) + DAU_PHAN_CACH_PHAN_MO_RONG + duoi;
    }

    private String layDuoiTuHeader() {
        String[] phan = phanHeader.split(DAU_PHAN_CACH_LOAI);
        return phan.length > 1 ? phan[1] : "bin";
    }
}

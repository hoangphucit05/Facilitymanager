package com.facilitymanager.util;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * Thread pool dùng chung cho tác vụ nền (gửi thông báo, ghi nhật ký bất đồng bộ, …).
 */
public final class TienIchLuongXuLy {

    private static final int SO_LUONG_LUONG_CORE = 5;
    private static final int SO_LUONG_LUONG_TOI_DA = 10;
    private static final long THOI_GIAN_SONG_MS = 2000L;
    private static final int DO_DAI_HANG_DOI = 100;

    private static final BlockingQueue<Runnable> hangDoi =
            new ArrayBlockingQueue<>(DO_DAI_HANG_DOI);

    private static final ThreadPoolExecutor pool = new ThreadPoolExecutor(
            SO_LUONG_LUONG_CORE,
            SO_LUONG_LUONG_TOI_DA,
            THOI_GIAN_SONG_MS,
            TimeUnit.MILLISECONDS,
            hangDoi,
            new ThreadPoolExecutor.CallerRunsPolicy()
    );

    static {
        pool.prestartAllCoreThreads();
    }

    private TienIchLuongXuLy() {
    }

    public static ThreadPoolExecutor layPool() {
        return pool;
    }

    public static void thucThi(Runnable congViec) {
        pool.execute(congViec);
    }
}

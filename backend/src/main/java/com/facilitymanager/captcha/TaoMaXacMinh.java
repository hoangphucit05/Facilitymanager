package com.facilitymanager.captcha;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.concurrent.ThreadLocalRandom;

/** Vẽ CAPTCHA PNG (116×36, 4 ký tự số). */
public class TaoMaXacMinh {

    private static final int DEFAULT_WIDTH = 116;
    private static final int DEFAULT_HEIGHT = 36;
    private static final int DEFAULT_CODE_LEN = 4;
    private static final int DEFAULT_LINES = 10;

    private final int width;
    private final int height;
    private final int codeCount;
    private final int lineCount;

    public TaoMaXacMinh() {
        this(DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_CODE_LEN, DEFAULT_LINES);
    }

    public TaoMaXacMinh(int width, int height, int codeCount, int lineCount) {
        this.width = width;
        this.height = height;
        this.codeCount = codeCount;
        this.lineCount = lineCount;
    }

    public byte[] writePng(String code) {
        if (code == null || code.length() != codeCount) {
            throw new IllegalArgumentException("code must be " + codeCount + " characters");
        }
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(new Color(245, 230, 250));
        g.fillRect(0, 0, width, height);

        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        for (int i = 0; i < lineCount; i++) {
            g.setColor(new Color(100 + rnd.nextInt(100), 100 + rnd.nextInt(100), 100 + rnd.nextInt(100), 120));
            g.setStroke(new BasicStroke(1f + rnd.nextFloat()));
            int x1 = rnd.nextInt(width);
            int y1 = rnd.nextInt(height);
            int x2 = rnd.nextInt(width);
            int y2 = rnd.nextInt(height);
            g.drawLine(x1, y1, x2, y2);
        }

        g.setFont(new Font("Arial", Font.BOLD, 22));
        for (int i = 0; i < code.length(); i++) {
            g.setColor(new Color(rnd.nextInt(80), rnd.nextInt(80), rnd.nextInt(80)));
            AffineTransform old = g.getTransform();
            double rot = (rnd.nextDouble() - 0.5) * 0.5;
            int x = 12 + i * 24;
            int y = 26;
            g.rotate(rot, x, y);
            g.drawString(String.valueOf(code.charAt(i)), x, y);
            g.setTransform(old);
        }
        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "png", out);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return out.toByteArray();
    }
}

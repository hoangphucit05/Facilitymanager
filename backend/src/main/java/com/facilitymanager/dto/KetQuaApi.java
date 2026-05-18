package com.facilitymanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class KetQuaApi<T> {

    private boolean success;
    private T result;
    private String message;

    public KetQuaApi() {
    }

    public KetQuaApi(boolean success, T result, String message) {
        this.success = success;
        this.result = result;
        this.message = message;
    }

    public static <T> KetQuaApi<T> ok(T result) {
        return new KetQuaApi<>(true, result, null);
    }

    public static KetQuaApi<Void> fail(String message) {
        return new KetQuaApi<>(false, null, message);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getResult() {
        return result;
    }

    public void setResult(T result) {
        this.result = result;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

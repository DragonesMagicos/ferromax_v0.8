package com.ferromax.erp.exception;

public class StockInsuficienteException extends RuntimeException {
    public StockInsuficienteException(String nombreProducto, int disponible, int solicitado) {
        super(String.format(
            "Stock insuficiente para '%s': disponible=%d, solicitado=%d",
            nombreProducto, disponible, solicitado
        ));
    }
}

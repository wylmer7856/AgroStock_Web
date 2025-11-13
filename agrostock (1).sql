-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 09, 2025 at 09:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `agrostock`
--

-- --------------------------------------------------------

--
-- Table structure for table `carrito`
--

CREATE TABLE `carrito` (
  `id_carrito` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL COMMENT 'Consumidor',
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `fecha_agregado` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen_url` varchar(500) DEFAULT NULL COMMENT 'URL de imagen de la categoría',
  `activa` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`, `imagen_url`, `activa`) VALUES
(1, 'Frutas', 'Frutas frescas del campo', NULL, 1),
(2, 'Verduras', 'Verduras y hortalizas frescas', NULL, 1),
(3, 'Granos', 'Granos y cereales', NULL, 1),
(4, 'Lácteos', 'Productos lácteos frescos', NULL, 1),
(5, 'Carnes', 'Carnes frescas', NULL, 1),
(6, 'Artesanías', 'Productos artesanales', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `ciudades`
--

CREATE TABLE `ciudades` (
  `id_ciudad` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `id_departamento` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ciudades`
--

INSERT INTO `ciudades` (`id_ciudad`, `nombre`, `id_departamento`) VALUES
(1, 'Bogotá D.C.', 1),
(2, 'Medellín', 2),
(3, 'Cali', 3),
(4, 'Barranquilla', 4),
(5, 'Cartagena', 5),
(6, 'Tunja', 6),
(7, 'Bucaramanga', 7);

-- --------------------------------------------------------

--
-- Table structure for table `departamentos`
--

CREATE TABLE `departamentos` (
  `id_departamento` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `id_region` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departamentos`
--

INSERT INTO `departamentos` (`id_departamento`, `nombre`, `id_region`) VALUES
(1, 'Cundinamarca', 1),
(2, 'Antioquia', 1),
(3, 'Valle del Cauca', 1),
(4, 'Atlántico', 2),
(5, 'Bolívar', 2),
(6, 'Boyacá', 1),
(7, 'Santander', 1);

-- --------------------------------------------------------

--
-- Table structure for table `detalle_pedidos`
--

CREATE TABLE `detalle_pedidos` (
  `id_detalle` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL COMMENT 'Precio al momento de la compra',
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mensajes`
--

CREATE TABLE `mensajes` (
  `id_mensaje` int(11) NOT NULL,
  `id_remitente` int(11) NOT NULL,
  `id_destinatario` int(11) NOT NULL,
  `id_producto` int(11) DEFAULT NULL COMMENT 'Producto relacionado si aplica',
  `asunto` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo_mensaje` enum('consulta','pedido','general') DEFAULT 'consulta',
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_envio` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL,
  `id_consumidor` int(11) NOT NULL,
  `id_productor` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','confirmado','en_preparacion','en_camino','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `direccion_entrega` varchar(255) NOT NULL,
  `id_ciudad_entrega` int(11) DEFAULT NULL,
  `metodo_pago` enum('efectivo','transferencia','nequi','daviplata','pse','tarjeta') DEFAULT 'efectivo',
  `estado_pago` enum('pendiente','pagado','reembolsado') DEFAULT 'pendiente',
  `notas` text DEFAULT NULL,
  `fecha_pedido` timestamp NULL DEFAULT current_timestamp(),
  `fecha_entrega` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pedidos`
--

INSERT INTO `pedidos` (`id_pedido`, `id_consumidor`, `id_productor`, `total`, `estado`, `direccion_entrega`, `id_ciudad_entrega`, `metodo_pago`, `estado_pago`, `notas`, `fecha_pedido`, `fecha_entrega`) VALUES
(1, 2, 4, 1.00, 'pendiente', 'cr 10 a 8-41', 1, 'efectivo', 'pendiente', 'traer robusta ', '2025-11-06 14:11:00', '2025-11-28 14:11:00');

-- --------------------------------------------------------

--
-- Table structure for table `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 5,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'kg',
  `id_usuario` int(11) NOT NULL COMMENT 'Productor que vende',
  `id_categoria` int(11) DEFAULT NULL,
  `id_ciudad_origen` int(11) DEFAULT NULL,
  `imagen_principal` varchar(500) DEFAULT NULL COMMENT 'URL de imagen principal del producto',
  `imagenes_adicionales` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array JSON con URLs de imágenes adicionales' CHECK (json_valid(`imagenes_adicionales`)),
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `productos`
--

INSERT INTO `productos` (`id_producto`, `nombre`, `descripcion`, `precio`, `stock`, `stock_minimo`, `unidad_medida`, `id_usuario`, `id_categoria`, `id_ciudad_origen`, `imagen_principal`, `imagenes_adicionales`, `disponible`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'papa', 'papapastusa', 3000.00, 15, 5, 'kg', 4, 2, 7, 'https://www.google.com/imgres?q=papa&imgurl=https%3A%2F%2Fsaborusa.com.pa%2Fimagesmg%2Fimagenes%2F5ff3e6a0b703f_potatoes-food-supermarket-agriculture-JG7QGNY.jpg&imgrefurl=https%3A%2F%2Fwww.saborusa.com.pa%2Fpost%2Flos-10-beneficios-de-la-papa-que-desconocias-&docid=m-73-kT45DbN2M&tbnid=Ekd-aErd6J3PbM&vet=12ahUKEwjwl4ir3eKQAxWoSDABHaJMCUUQM3oECBgQAA..i&w=3955&h=2967&hcb=2&ved=2ahUKEwjwl4ir3eKQAxWoSDABHaJMCUUQM3oECBgQAA', NULL, 1, '2025-11-08 14:09:09', '2025-11-08 14:09:09');

-- --------------------------------------------------------

--
-- Table structure for table `regiones`
--

CREATE TABLE `regiones` (
  `id_region` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `regiones`
--

INSERT INTO `regiones` (`id_region`, `nombre`) VALUES
(1, 'Región Andina'),
(2, 'Región Caribe'),
(3, 'Región Pacífica'),
(4, 'Región Orinoquía'),
(5, 'Región Amazonía');

-- --------------------------------------------------------

--
-- Table structure for table `reportes`
--

CREATE TABLE `reportes` (
  `id_reporte` int(11) NOT NULL,
  `id_usuario_reportante` int(11) NOT NULL,
  `tipo_reporte` enum('producto_inapropiado','usuario_inapropiado','contenido_ofensivo','spam','fraude','otro') NOT NULL,
  `id_elemento_reportado` int(11) DEFAULT NULL COMMENT 'ID del producto o usuario reportado',
  `tipo_elemento` enum('producto','usuario') DEFAULT 'producto',
  `descripcion` text NOT NULL,
  `estado` enum('pendiente','en_revision','resuelto','rechazado') NOT NULL DEFAULT 'pendiente',
  `accion_tomada` text DEFAULT NULL,
  `fecha_reporte` timestamp NULL DEFAULT current_timestamp(),
  `fecha_resolucion` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reseñas`
--

CREATE TABLE `reseñas` (
  `id_resena` int(11) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_consumidor` int(11) NOT NULL,
  `id_productor` int(11) NOT NULL,
  `calificacion` int(11) NOT NULL COMMENT '1-5 estrellas',
  `comentario` text DEFAULT NULL,
  `fecha_resena` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tokens_recuperacion`
--

CREATE TABLE `tokens_recuperacion` (
  `id_token` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_expiracion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `historial_precios`
--

CREATE TABLE `historial_precios` (
  `id_historial` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `precio_anterior` decimal(10,2) NOT NULL,
  `precio_nuevo` decimal(10,2) NOT NULL,
  `fecha_cambio` timestamp NULL DEFAULT current_timestamp(),
  `id_usuario_modifico` int(11) DEFAULT NULL COMMENT 'Usuario que modificó el precio (productor o admin)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` enum('pedido','stock','precio','mensaje','sistema','promocion') NOT NULL DEFAULT 'sistema',
  `id_referencia` int(11) DEFAULT NULL COMMENT 'ID del elemento relacionado (pedido, producto, etc.)',
  `tipo_referencia` enum('pedido','producto','mensaje','usuario') DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_leida` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lista_deseos`
--

CREATE TABLE `lista_deseos` (
  `id_lista` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL COMMENT 'Consumidor',
  `id_producto` int(11) NOT NULL,
  `fecha_agregado` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `id_ciudad` int(11) DEFAULT NULL,
  `rol` enum('admin','consumidor','productor') NOT NULL DEFAULT 'consumidor',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `email_verificado` tinyint(1) NOT NULL DEFAULT 0,
  `foto_perfil` varchar(500) DEFAULT NULL COMMENT 'URL de la imagen de perfil',
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  `ultimo_acceso` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password`, `telefono`, `direccion`, `id_ciudad`, `rol`, `activo`, `email_verificado`, `foto_perfil`, `fecha_registro`, `ultimo_acceso`) VALUES
(2, 'Wilmer Andres Morales', 'moraleswilmerandres8@gmail.com', 'ICneGYyaw8EsYxom60G5aqSGmNLzNmg0choWW-SdU_0PYIayLjgBTB3G_VkUmStl', '3225698541', 'El cundinamarca', 1, 'productor', 1, 0, NULL, '2025-11-08 06:25:47', '2025-11-08 06:32:05'),
(4, 'Andres Saavedra', 'andresfelipesaa2006@gmail.com', 'MAGw0No3-oh8cBZnxMK6ASI0G41STxqf3V6RI5sClIgLJJ-159iNYiHGgXfwdY-i', '3145269857', 'Belen', 7, 'admin', 1, 0, NULL, '2025-11-08 06:35:24', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `carrito`
--
ALTER TABLE `carrito`
  ADD PRIMARY KEY (`id_carrito`),
  ADD UNIQUE KEY `usuario_producto` (`id_usuario`,`id_producto`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indexes for table `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Indexes for table `ciudades`
--
ALTER TABLE `ciudades`
  ADD PRIMARY KEY (`id_ciudad`),
  ADD KEY `id_departamento` (`id_departamento`);

--
-- Indexes for table `departamentos`
--
ALTER TABLE `departamentos`
  ADD PRIMARY KEY (`id_departamento`),
  ADD KEY `id_region` (`id_region`);

--
-- Indexes for table `detalle_pedidos`
--
ALTER TABLE `detalle_pedidos`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_pedido` (`id_pedido`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indexes for table `mensajes`
--
ALTER TABLE `mensajes`
  ADD PRIMARY KEY (`id_mensaje`),
  ADD KEY `id_remitente` (`id_remitente`),
  ADD KEY `id_destinatario` (`id_destinatario`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `idx_mensajes_leido` (`leido`);

--
-- Indexes for table `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `id_consumidor` (`id_consumidor`),
  ADD KEY `id_productor` (`id_productor`),
  ADD KEY `id_ciudad_entrega` (`id_ciudad_entrega`),
  ADD KEY `idx_pedidos_estado` (`estado`),
  ADD KEY `idx_pedidos_fecha` (`fecha_pedido`);

--
-- Indexes for table `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_categoria` (`id_categoria`),
  ADD KEY `id_ciudad_origen` (`id_ciudad_origen`),
  ADD KEY `idx_productos_disponible` (`disponible`),
  ADD KEY `idx_productos_precio` (`precio`);

--
-- Indexes for table `regiones`
--
ALTER TABLE `regiones`
  ADD PRIMARY KEY (`id_region`);

--
-- Indexes for table `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `id_usuario_reportante` (`id_usuario_reportante`),
  ADD KEY `idx_reportes_estado` (`estado`);

--
-- Indexes for table `reseñas`
--
ALTER TABLE `reseñas`
  ADD PRIMARY KEY (`id_resena`),
  ADD UNIQUE KEY `pedido_resena` (`id_pedido`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `id_consumidor` (`id_consumidor`),
  ADD KEY `id_productor` (`id_productor`);

--
-- Indexes for table `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  ADD PRIMARY KEY (`id_token`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `idx_token` (`token`);

--
-- Indexes for table `historial_precios`
--
ALTER TABLE `historial_precios`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `id_usuario_modifico` (`id_usuario_modifico`),
  ADD KEY `idx_historial_fecha` (`fecha_cambio`);

--
-- Indexes for table `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `idx_notificaciones_leida` (`leida`),
  ADD KEY `idx_notificaciones_tipo` (`tipo`),
  ADD KEY `idx_notificaciones_fecha` (`fecha_creacion`);

--
-- Indexes for table `lista_deseos`
--
ALTER TABLE `lista_deseos`
  ADD PRIMARY KEY (`id_lista`),
  ADD UNIQUE KEY `usuario_producto` (`id_usuario`,`id_producto`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_ciudad` (`id_ciudad`),
  ADD KEY `idx_usuarios_rol` (`rol`),
  ADD KEY `idx_usuarios_activo` (`activo`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `carrito`
--
ALTER TABLE `carrito`
  MODIFY `id_carrito` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ciudades`
--
ALTER TABLE `ciudades`
  MODIFY `id_ciudad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `departamentos`
--
ALTER TABLE `departamentos`
  MODIFY `id_departamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `detalle_pedidos`
--
ALTER TABLE `detalle_pedidos`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mensajes`
--
ALTER TABLE `mensajes`
  MODIFY `id_mensaje` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `regiones`
--
ALTER TABLE `regiones`
  MODIFY `id_region` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reseñas`
--
ALTER TABLE `reseñas`
  MODIFY `id_resena` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  MODIFY `id_token` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `historial_precios`
--
ALTER TABLE `historial_precios`
  MODIFY `id_historial` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lista_deseos`
--
ALTER TABLE `lista_deseos`
  MODIFY `id_lista` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `carrito`
--
ALTER TABLE `carrito`
  ADD CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `carrito_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Constraints for table `ciudades`
--
ALTER TABLE `ciudades`
  ADD CONSTRAINT `ciudades_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`);

--
-- Constraints for table `departamentos`
--
ALTER TABLE `departamentos`
  ADD CONSTRAINT `departamentos_ibfk_1` FOREIGN KEY (`id_region`) REFERENCES `regiones` (`id_region`);

--
-- Constraints for table `detalle_pedidos`
--
ALTER TABLE `detalle_pedidos`
  ADD CONSTRAINT `detalle_pedidos_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_pedidos_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`);

--
-- Constraints for table `mensajes`
--
ALTER TABLE `mensajes`
  ADD CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`id_remitente`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `mensajes_ibfk_2` FOREIGN KEY (`id_destinatario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `mensajes_ibfk_3` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`);

--
-- Constraints for table `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_consumidor`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`id_productor`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `pedidos_ibfk_3` FOREIGN KEY (`id_ciudad_entrega`) REFERENCES `ciudades` (`id_ciudad`);

--
-- Constraints for table `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`),
  ADD CONSTRAINT `productos_ibfk_3` FOREIGN KEY (`id_ciudad_origen`) REFERENCES `ciudades` (`id_ciudad`);

--
-- Constraints for table `reportes`
--
ALTER TABLE `reportes`
  ADD CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`id_usuario_reportante`) REFERENCES `usuarios` (`id_usuario`);

--
-- Constraints for table `reseñas`
--
ALTER TABLE `reseñas`
  ADD CONSTRAINT `reseñas_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  ADD CONSTRAINT `reseñas_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  ADD CONSTRAINT `reseñas_ibfk_3` FOREIGN KEY (`id_consumidor`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `reseñas_ibfk_4` FOREIGN KEY (`id_productor`) REFERENCES `usuarios` (`id_usuario`);

--
-- Constraints for table `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  ADD CONSTRAINT `tokens_recuperacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Constraints for table `historial_precios`
--
ALTER TABLE `historial_precios`
  ADD CONSTRAINT `historial_precios_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE,
  ADD CONSTRAINT `historial_precios_ibfk_2` FOREIGN KEY (`id_usuario_modifico`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Constraints for table `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Constraints for table `lista_deseos`
--
ALTER TABLE `lista_deseos`
  ADD CONSTRAINT `lista_deseos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `lista_deseos_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- Adicionar novos valores ao enum tipo_veiculo
ALTER TYPE tipo_veiculo ADD VALUE IF NOT EXISTS 'suv';
ALTER TYPE tipo_veiculo ADD VALUE IF NOT EXISTS 'caminhonete';
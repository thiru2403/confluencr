import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class TransactionDto {
  @IsString() @IsNotEmpty() transaction_id: string;
  @IsString() @IsNotEmpty() source_account: string;
  @IsString() @IsNotEmpty() destination_account: string;
  @IsNumber() @IsPositive() amount: number;
  @IsString() @IsNotEmpty() currency: string;
}

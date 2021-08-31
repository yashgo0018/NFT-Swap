<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSwapsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('swaps', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('swap_id')->unique();
            $table->string('creator');
            $table->string('swap_create_transaction')->nullable();
            $table->string('swap_executed_transaction')->nullable();
            $table->string('contract_1_address');
            $table->string('token_1');
            $table->tinyInteger('type_1')->comment('0: erc721, 1: erc1155');
            $table->string('contract_2_address');
            $table->string('token_2');
            $table->string('token_2_owner')->nullable();
            $table->tinyInteger('type_2')->comment('0: erc721, 1: erc1155');
            $table->boolean('done')->default(false);
            $table->boolean('cancelled')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('swaps');
    }
}

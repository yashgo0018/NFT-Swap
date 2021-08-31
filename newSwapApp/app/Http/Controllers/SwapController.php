<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Swap;

class SwapController extends Controller
{
    public function index($address) {
        return Swap::where('creator', $address)->orderBy('created_at', 'DESC')->get();
    }

    public function get_swap_by_id($swap_id) {
        return Swap::where('swap_id', $swap_id)->firstOrFail();
    }
}

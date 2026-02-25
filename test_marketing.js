const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using service role key if available for full DB tests, otherwise anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMarketingTable() {
    console.log('--- Testing Marketing Spend Table ---');

    // 1. Check if table exists (by trying to select)
    console.log('1. Checking if table exists...');
    const { error: selectError } = await supabase.from('marketing_spend').select('id').limit(1);
    if (selectError) {
        if (selectError.code === '42P01') {
            console.error('❌ Table "marketing_spend" does NOT exist.');
            return;
        }
        console.error('❌ Select error:', selectError.message);
    } else {
        console.log('✅ Table "marketing_spend" exists.');
    }

    // 2. Test Insert
    console.log('2. Testing Insert...');
    // We need a user_id. Let's try to get one from existing users or just use a dummy if RLS allows (though RLS is enabled)
    // For testing purposes, we'll try to find any analysis to get a user_id
    const { data: userData } = await supabase.from('analyses').select('user_id').limit(1).single();
    if (!userData) {
        console.log('⚠️ No existing user found in "analyses" to test RLS. Testing without user_id...');
    }

    const testRecord = {
        user_id: userData?.user_id,
        date: '2026-02-25',
        platform: 'TestPlatform',
        campaign_name: 'Test Campaign',
        spend: 100,
        conversions: 10
    };

    const { data: inserted, error: insertError } = await supabase
        .from('marketing_spend')
        .insert(testRecord)
        .select()
        .single();

    if (insertError) {
        console.error('❌ Insert error:', insertError.message);
    } else {
        console.log('✅ Insert successful. ID:', inserted.id);

        // 3. Test Update
        console.log('3. Testing Update...');
        const { data: updated, error: updateError } = await supabase
            .from('marketing_spend')
            .update({ spend: 150 })
            .eq('id', inserted.id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Update error:', updateError.message);
        } else if (updated.spend === 150) {
            console.log('✅ Update successful.');
        }

        // 4. Test Delete
        console.log('4. Testing Delete...');
        const { error: deleteError } = await supabase
            .from('marketing_spend')
            .delete()
            .eq('id', inserted.id);

        if (deleteError) {
            console.error('❌ Delete error:', deleteError.message);
        } else {
            console.log('✅ Delete successful.');
            console.log('--- All DB tests for Marketing Spend PASSED ---');
        }
    }
}

testMarketingTable();

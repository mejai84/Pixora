const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing tables...');
    const tables = ['analyses', 'winning_products', 'profit_records', 'campaign_records', 'user_api_configs', 'user_settings'];
    for (const table of tables) {
        try {
            const col = table === 'user_settings' ? 'user_id' : 'id';
            const { error } = await supabase.from(table).select(col).limit(1);
            if (error) {
                console.error(`Error with ${table}:`, error.message, error.code);
            } else {
                console.log(`Table ${table} is OK.`);
            }
        } catch (err) {
            console.error(`Unexpected error on ${table}:`, err.message);
        }
    }
}

testConnection();
